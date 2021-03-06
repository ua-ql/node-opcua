/**
 * @module opcua.miscellaneous
 */

import util from "util";
import assert from "better-assert";
import { MessageBuilderBase } from "lib/misc/message_builder_base";
import { chooseSecurityHeader } from "lib/services/secure_channel_service";
import { SymmetricAlgorithmSecurityHeader } from "lib/services/secure_channel_service";
import { SequenceHeader } from "lib/services/secure_channel_service";
import { BinaryStream } from "lib/misc/binaryStream";
import { decodeExpandedNodeId } from "lib/misc/encode_decode";
import { packet_analyzer } from "lib/misc/packet_analyzer";
import { hexDump } from "lib/misc/utils";
import _ from "underscore";
import { 
  make_debugLog,
  checkDebugFlag
} from "lib/misc/utils";

import { SecurityPolicy, fromURI, getCryptoFactory } from "lib/misc/security_policy";

import { MessageSecurityMode } from "schemas/MessageSecurityMode_enum";
import crypto_utils from "lib/misc/crypto_utils";
import { decodeStatusCode } from "lib/datamodel/opcua_status_code";
import { decodeString } from "lib/misc/encode_decode";
import  { constructObject } from "lib/misc/factories_factories";

const debugLog = make_debugLog(__filename);
const doDebug = checkDebugFlag(__filename);


/**
 * @class MessageBuilder
 * @extends MessageBuilderBase
 * @constructor
 *
 * @param options
 * @param options.securityMode {MessageSecurityMode} the security Mode
 * @param [options.objectFactory=factories] a object that provides a constructObject(id) method
 */
class MessageBuilder extends MessageBuilderBase {
    constructor(options = {}) {
        super(options);

        this.securityPolicy = SecurityPolicy.Invalid; // not known yet
        this.securityMode = options.securityMode || MessageSecurityMode.INVALID; // not known yet

        this.objectFactory = options.objectFactory || { constructObject };

        assert(_.isFunction(this.objectFactory.constructObject), " the objectFactory must provide a constructObject method");

        this.previous_sequenceNumber = -1; // means unknown
        assert(_.isFinite(this.previous_sequenceNumber));
    }

    setSecurity(securityMode, securityPolicy) {
        assert(this.securityMode === MessageSecurityMode.INVALID, "security already set");
        this.securityPolicy = SecurityPolicy.get(securityPolicy);
        this.securityMode = MessageSecurityMode.get(securityMode);
        assert(this.securityPolicy !== undefined, `invalid security policy ${securityPolicy}`);
        assert(this.securityMode !== undefined, `invalid security mode ${securityMode}`);
        assert(this.securityPolicy !== SecurityPolicy.Invalid);
        assert(this.securityMode !== MessageSecurityMode.INVALID);
    }

    _validateSequenceNumber(sequenceNumber) {
      // checking that sequenceNumber is increasing
        assert(_.isFinite(this.previous_sequenceNumber));
        assert(_.isFinite(sequenceNumber) && sequenceNumber >= 0);

        let expectedSequenceNumber;
        if (this.previous_sequenceNumber !== -1) {
            expectedSequenceNumber = this.previous_sequenceNumber + 1;

            if (expectedSequenceNumber !== sequenceNumber) {
                const errMessage = `Invalid Sequence Number found ( expected ${expectedSequenceNumber}, got ${sequenceNumber})`;
                debugLog(errMessage.red.bold);
              /**
               * notify the observers that a message with an invalid sequence number has been received.
               * @event invalid_sequence_number
               * @param {Number} expected sequence Number
               * @param {Number} actual sequence Number
               */
                this.emit("invalid_sequence_number", expectedSequenceNumber, sequenceNumber);
            }
          // todo : handle the case where sequenceNumber wraps back to < 1024
        }
      /* istanbul ignore next */
        if (doDebug) {
            debugLog(" Sequence Number = ".yellow.bold, sequenceNumber);
        }
        this.previous_sequenceNumber = sequenceNumber;
    }

    _decrypt_OPN(binaryStream) {
        assert(this.securityPolicy !== SecurityPolicy.None);
        assert(this.securityPolicy !== SecurityPolicy.Invalid);
        assert(this.securityMode !== MessageSecurityMode.NONE);
      // xx assert(this.securityMode !== MessageSecurityMode.INVALID);

      /* istanbul ignore next */
        if (doDebug) {
            debugLog("securityHeader", JSON.stringify(this.securityHeader, null, " "));
        }

      // OpcUA part 2 V 1.02 page 15
      // 4.11 OPC UA Security Related Services
      // [...]
      // The OPC UA Client sends its Public Key in a Digital Certificate and secret information with the
      // OpenSecureChannel service Message to the Server. This Message is secured by applying
      // Asymmetric Encryption with the Server's Public Key and by generating Asymmetric Signatures with
      // the Client's Private Key. However the Digital Certificate is sent unencrypted so that the receiver can
      // use it to verify the Asymmetric Signature.
      // [...]
      //

      /* istanbul ignore next */
        if (doDebug) {
            debugLog("EN------------------------------".cyan);
            debugLog(hexDump(binaryStream._buffer));
            debugLog("---------------------- SENDER CERTIFICATE");
            debugLog(hexDump(this.securityHeader.senderCertificate));
        }

      /* istanbul ignore next */
        if (!crypto_utils.isFullySupported()) {
            this._report_error("YOUR NODE CONFIGURATION DOES NOT ALLOW SIGN and ENCRYPT YET - ");
            return false;
        }

        if (!this.cryptoFactory) {
            this._report_error(` Security Policy ${this.securityPolicy.key} is not implemented yet`);
            return false;
        }

      // The message has been signed  with sender private key and has been encrypted with receiver public key.
      // We shall decrypt it with the receiver private key.
        const buf = binaryStream._buffer.slice(binaryStream.length);

        if (this.securityHeader.receiverCertificateThumbprint) {
   // this mean that the message has been encrypted ....

            assert(typeof this.privateKey === "string", "expecting valid key");

            const decryptedBuffer = this.cryptoFactory.asymmetricDecrypt(buf, this.privateKey);

          // replace decrypted buffer in initial buffer
            decryptedBuffer.copy(binaryStream._buffer, binaryStream.length);

          // adjust length
            binaryStream._buffer = binaryStream._buffer.slice(0, binaryStream.length + decryptedBuffer.length);

          /* istanbul ignore next */
            if (doDebug) {
                debugLog("DE-----------------------------".cyan);
                debugLog(hexDump(binaryStream._buffer));
                debugLog("-------------------------------".cyan);
                debugLog("Certificate :", hexDump(this.securityHeader.senderCertificate));
            }
        }

        const cert = crypto_utils.exploreCertificate(this.securityHeader.senderCertificate);
      // then verify the signature
        const signatureLength = cert.publicKeyLength; // 1024 bits = 128Bytes or 2048=256Bytes
        assert(signatureLength === 128 || signatureLength === 256);

        const chunk = binaryStream._buffer;

        const signatureIsOK = this.cryptoFactory.asymmetricVerifyChunk(chunk, this.securityHeader.senderCertificate);

        if (!signatureIsOK) {
            console.error(hexDump(binaryStream._buffer));
            this._report_error("SIGN and ENCRYPT asymmetricVerify : Invalid packet signature");
            return false;
        }

      // remove signature
        binaryStream._buffer = crypto_utils.reduceLength(binaryStream._buffer, signatureLength);

      // remove padding
        if (this.securityHeader.receiverCertificateThumbprint) {
            binaryStream._buffer = crypto_utils.removePadding(binaryStream._buffer);
        }

        return true; // success
    }

    pushNewToken(securityToken, derivedKeys) {
        assert(securityToken.hasOwnProperty("tokenId"));
      // xx assert(derivedKeys ); in fact, can be null

        this._tokenStack = this._tokenStack || [];
        assert(this._tokenStack.length === 0 || this._tokenStack[0].tokenId !== securityToken.tokenId);
        this._tokenStack.push({ securityToken, derivedKeys });
    }

    _select_matching_token(tokenId) {
        let got_new_token = false;
        this._tokenStack = this._tokenStack || [];
        while (this._tokenStack.length) {
            if (this._tokenStack.length === 0) {
                return null; // no token
            }
            if (this._tokenStack[0].securityToken.tokenId === tokenId) {
                if (got_new_token) {
                    this.emit("new_token", tokenId);
                }
                return this._tokenStack[0];
            }
          // remove first
            this._tokenStack = this._tokenStack.slice(1);
            got_new_token = true;
        }
    }

    _decrypt_MSG(binaryStream) {
        assert(this.securityHeader instanceof SymmetricAlgorithmSecurityHeader);
        assert(this.securityMode !== MessageSecurityMode.NONE);
        assert(this.securityMode !== MessageSecurityMode.INVALID);
        assert(this.securityPolicy !== SecurityPolicy.None);
        assert(this.securityPolicy !== SecurityPolicy.Invalid);

      // Check  security token
      // securityToken may have been renewed
        const securityTokenData = this._select_matching_token(this.securityHeader.tokenId);
        if (!securityTokenData) {
            this._report_error(`Security token data for token ${this.securityHeader.tokenId} doesn't exist`);
            return false;
        }

        assert(securityTokenData.hasOwnProperty("derivedKeys"));

      // SecurityToken may have expired, in this case the MessageBuilder shall reject the message
        if (securityTokenData.securityToken.expired) {
            this._report_error(`Security token has expired : tokenId ${securityTokenData.securityToken.tokenId}`);
            return false;
        }

      // We shall decrypt it with the receiver private key.
        const buf = binaryStream._buffer.slice(binaryStream.length);

        const derivedKeys = securityTokenData.derivedKeys;

        assert(derivedKeys !== null);
        assert(derivedKeys.signatureLength, " must provide a signature length");

        if (this.securityMode === MessageSecurityMode.SIGNANDENCRYPT) {
            const decryptedBuffer = crypto_utils.decryptBufferWithDerivedKeys(buf, derivedKeys);

          // replace decrypted buffer in initial buffer
            decryptedBuffer.copy(binaryStream._buffer, binaryStream.length);

          // adjust length
            binaryStream._buffer = binaryStream._buffer.slice(0, binaryStream.length + decryptedBuffer.length);

          /* istanbul ignore next */
            if (doDebug) {
                debugLog("DE-----------------------------".cyan);
                debugLog(hexDump(binaryStream._buffer));
                debugLog("-------------------------------".cyan);
            }
        }

      // now check signature ....
        const chunk = binaryStream._buffer;

        const signatureIsOK = crypto_utils.verifyChunkSignatureWithDerivedKeys(chunk, derivedKeys);
        if (!signatureIsOK) {
            this._report_error("SIGN and ENCRYPT : Invalid packet signature");
            return false;
        }

      // remove signature
        binaryStream._buffer = crypto_utils.reduceLength(binaryStream._buffer, derivedKeys.signatureLength);

        if (this.securityMode === MessageSecurityMode.SIGNANDENCRYPT) {
          // remove padding
            binaryStream._buffer = crypto_utils.removePadding(binaryStream._buffer);
        }

        return true;
    }

    _decrypt(binaryStream) {
        if (this.securityPolicy === SecurityPolicy.Invalid) {
          // this._report_error("SecurityPolicy");
          // return false;
            return true;
        }

        const msgType = this.messageHeader.msgType;

      // check if security is active or not
        if (this.securityPolicy === SecurityPolicy.None) {
            this.securityMode = MessageSecurityMode.NONE;
            assert(this.securityMode === MessageSecurityMode.NONE, "expecting securityMode = None when securityPolicy is None");
            return true; // nothing to do
        }
        assert(this.securityMode !== MessageSecurityMode.NONE);


        if (msgType === "OPN") {
            return this._decrypt_OPN(binaryStream);
        } 
        return this._decrypt_MSG(binaryStream);
    }

  /**
   * @method _read_headers
   * @param binaryStream
   * @return {Boolean}
   * @private
   */
    _read_headers(binaryStream) {
        MessageBuilderBase.prototype._read_headers.apply(this, arguments);
        assert(binaryStream.length === 12);

        const msgType = this.messageHeader.msgType;

        if (msgType === "HEL" || msgType === "ACK") {
            this.securityPolicy = SecurityPolicy.None;
        } else if (msgType === "ERR") {
          // extract Error StatusCode and additional message
            binaryStream.length = 8;
            const errorCode = decodeStatusCode(binaryStream);
            const message = decodeString(binaryStream);

            console.error(" ERROR RECEIVED FROM SENDER".red.bold, errorCode.toString().cyan, message);
            console.error(hexDump(binaryStream._buffer));
            return true;
        } else {
            this.securityHeader = chooseSecurityHeader(msgType);
            this.securityHeader.decode(binaryStream);

            if (msgType === "OPN") {
                this.securityPolicy = fromURI(this.securityHeader.securityPolicyUri);
                this.cryptoFactory = getCryptoFactory(this.securityPolicy);
            }

            if (!this._decrypt(binaryStream)) {
                return false;
            }

            this.sequenceHeader = new SequenceHeader();
            this.sequenceHeader.decode(binaryStream);

          /* istanbul ignore next */
            if (doDebug) {
                debugLog(" Sequence Header", this.sequenceHeader);
            }

            this._validateSequenceNumber(this.sequenceHeader.sequenceNumber);
        }
        return true;
    }

    _safe_decode_message_body(full_message_body, objMessage, binaryStream) {
        try {
          // de-serialize the object from the binary stream
            const options = this.objectFactory;
            objMessage.decode(binaryStream, options);
        }  catch (err) {
            console.error(err);
            console.error(err.stack);
            console.error(hexDump(full_message_body));
            packet_analyzer(full_message_body);

            console.error(" ---------------- block");
            this.message_chunks.forEach((messageChunk) => {
                console.error(hexDump(messageChunk));
            });
            return false;
        }
        return true;
    }

    _decode_message_body(full_message_body) {
        const binaryStream = new BinaryStream(full_message_body);
        const msgType = this.messageHeader.msgType;

        if (msgType === "ERR") {
          // invalid message type
            this._report_error("ERROR RECEIVED");
            return false;
        }
        if (msgType === "HEL" || msgType === "ACK") {
          // invalid message type
            this._report_error("Invalid message type ( HEL/ACK )");
            return false;
        }

      // read expandedNodeId:
        const id = decodeExpandedNodeId(binaryStream);

      // construct the object
        const objMessage = this.objectFactory.constructObject(id);

        if (!objMessage) {
            this._report_error(`cannot construct object with nodeID ${id}`);
            return false;
        } 
        debugLog("message size =",this.total_message_size," body size =",this.total_body_size);

        if (this._safe_decode_message_body(full_message_body, objMessage, binaryStream)) {
            try {
                  /**
                   * notify the observers that a full message has been received
                   * @event message
                   * @param {Object} objMessage the decoded message object
                   * @param {String} msgType the message type ( "HEL","ACK","OPN","CLO" or "MSG" )
                   * @param {Number} the request Id
                   */
                this.emit("message", objMessage, msgType, this.sequenceHeader.requestId, this.secureChannelId);
            }      catch (err) {
                  // this code catches a uncaught exception somewhere in one of the event handler
                  // this indicates a bug in the code that uses this class
                  // please check the stack trace to find the problem
                console.error("MessageBuilder : ERROR DETECTED IN event handler".red);
                console.error(err);
                console.error(err.stack);
            }
        } else {
            const message = `cannot decode message  for valid object of type ${id.toString()} ${objMessage.constructor.name}`;
            console.error(message);
            this._report_error(message);
            return false;
        }
    
        return true;
    }
}

export { MessageBuilder };
