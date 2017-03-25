module.exports.$ = document.querySelector.bind(document);
module.exports.$$ = document.querySelectorAll.bind(document);

module.exports.readFileAsString = file => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = evt => {
      let string = evt.target.result;
      resolve(string);
    };

    reader.readAsText(file);
  });
}

module.exports.readFileAsArrayBuffer = (file, encoding = "utf-8") => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = evt => {
      let buffer = evt.target.result;
      let bufferView = new Uint8Array(buffer);

      let decoder = new TextDecoder(encoding);
      let string = decoder.decode(bufferView);
      resolve(string);
    };

    reader.readAsArrayBuffer(file);
  });
}
