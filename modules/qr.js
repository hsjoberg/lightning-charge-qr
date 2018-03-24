const QREncoder = require('qr').Encoder;

const qr = require('qr-image');

/**
  *
  * @returns Promise
  */
exports.generatePNG = (text, dotSize = 4) => {
  return new Promise(function(resolve, reject) {
    const encoder = new QREncoder();
    encoder.encode(text, undefined, {
      margin: 2,
      case_sensitive: false,
      dot_size: dotSize
    });

    encoder.on('end', (pngData) => {
      resolve(pngData);
    });

    encoder.on('error', (err) => {
      reject(err);
    });
  });
};

exports.generatePNG2 = (text, dotSize = 4) => {
  const image = qr.imageSync(text, {
    margin: 2,
    size: dotSize,
    ec_level: "L"
  });
  return image;
};
