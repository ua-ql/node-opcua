//
// note: new Buffer(size)#  is deprecated since: v6.0. and is replaced with Buffer.allocUnsafe
//       to ensure backward compatibility we have to replace
//       new Buffer(size) with createFastUninitializedBuffer(size)
//
//       Buffer.alloc and Buffer.allocUnsafe have been introduced in nodejs 5.1.0
//  in node 0.11 new Buffer
//

export const createFastUninitializedBuffer = Buffer.allocUnsafe 
  ? Buffer.allocUnsafe 
  : function a(size) {
      return new Buffer(size);
  };

if (!Buffer.from) {
    Buffer.from = (a, b, c) => new Buffer(a,b,c);
}

