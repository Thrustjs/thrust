var result = [];

function stream(bytes) {
    result.push(String.fromCharCode.apply(null, bytes).replace(/\0/g, ''));
}

stream.getResult = function() {
    return result;
}

exports = stream;
