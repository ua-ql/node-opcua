require("babel-register");


function main() {
    if (process.argv.length != 3) {
        console.log("Invalid number of   Argument ", process.argv);
        return;
        throw new Error('Improper Args length')
    }
    console.log("process.argv.length ", process.argv.length);

    /*global require,console,setTimeout */
    var opcua = require("../../index"); // node-opcua
    var async = require("async");


    var port = process.argv[2];


    var endpointUrl = "opc.tcp://" + require("os").hostname() + ":" + port;
    console.log("endpointUrl = ", endpointUrl);

    var options = {
        requestedSessionTimeout: 101, // very short
        keepSessionAlive: true,
        connectionStrategy: {
            maxRetry: 0 // << NO RETRY !
        }
    };

    var client = new opcua.OPCUAClient(options);

    var the_session;

    async.series([

            // step 1 : connect to
            function (callback) {
                client.connect(endpointUrl, function (err) {
                    if (err) {
                        console.log(" cannot connect to endpoint :", endpointUrl);
                    } else {
                        console.log("connected !");
                    }
                    callback(err);
                });
            },

            // step 2 : createSession
            function (callback) {
                client.createSession(function (err, session) {
                    if (!err) {
                        the_session = session;
                    }
                    callback(err);
                });
            },

            // step 3 : browse
            function (callback) {
                setTimeout(function () {
                    console.log(" CRASHING !!!!");
                    process.exit(-1);
                }, 3000);
            },
        ],
        function (err) {
            if (err) {
                console.log(" failure ", err);
            } else {
                console.log("done!");
            }
        });
}
main();
