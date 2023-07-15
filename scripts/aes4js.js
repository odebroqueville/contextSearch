// aes4js, by dandavis. MIT applies.
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.aes4js = factory();
  }
}(this, function () {
	
function aesEnc(key, str) {
	var iv = window.crypto.getRandomValues(new Uint8Array(12)),
		encoder = new TextEncoder('utf-8'),
		encodedString = encoder.encode(str),
		bin = 0;
	if(typeof str === "object") { // allows binary as well as string input
		encodedString = str; // arrayish
		bin = 1;
	}
	
	return derive(key, iv).then(function(key) {
		return window.crypto.subtle.encrypt({
			name: "AES-GCM",
			iv: iv,
			tagLength: 128,
		}, key, encodedString)
		  .then(function(encrypted) {
			return window.crypto.subtle.exportKey("jwk", key)
			  .then(function(c) { // turn bin array into exportable dataURL:
				return new Promise(function(resolve, reject) {
					var fr = new FileReader;
					fr.onload = function() {
						resolve({
							encrypted: fr.result, // ct
							iv: [].slice.call(iv),// iv
							bin: bin              // type flag
						});
					};
					fr.onerror = reject;
					fr.readAsDataURL(new Blob([encrypted]));
				}); // end fr promise wrapper
			}); // end export
		}); //end encrypt
	}) //end derive
	.catch(console.error);
} /* end aesEnc() */

function aesDec(key, obj) {
	if(typeof obj === "string") obj = JSON.parse(obj);
	return derive(key, typeof obj.bin==="number" ? obj.iv : "").then(function(key) {
		return new Promise(function(resolve, reject) { // turn dataURL into bin array:
			var blob = dataUrlToBlob(obj.encrypted),
				fr = new FileReader();
			fr.onload = function() { // feed bin array to native decrypt:
				window.crypto.subtle.decrypt({
					name: "AES-GCM",
					iv: new Uint8Array(obj.iv),
					tagLength: 128,
				}, key, fr.result)
				  .then(function(x){ // if not bin input, decode:
					return obj.bin ? x : new TextDecoder("utf-8").decode(x);
				  })
				  .then(resolve)
				  .catch(function(y) { // given a op err here, a wrong pw was given
					if(String(y) === "OperationError") y = "Oops!\n\nWrong Password, try again.";
					reject(y);
				}); //end catch
			}; //end fr.onload()
			fr.readAsArrayBuffer(blob);
		}) //end promise wrapper
		.catch(function(e) {throw e;});
	}); //end derive
} /* end aesDec() */

function sha256(str) {
	return crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(str))
	  .then(function(x) {// turn into hex string:
		return Array.from(new Uint8Array(x)).map(function(b) { 
			return('00' + b.toString(16)).slice(-2);
		}).join('');
	});
} /* end sha256() */

function derive(plainText, iv) { // key derivation using 1,000,000x pbkdf w/sha256
	if(typeof plainText==="object" && plainText.constructor=== CryptoKey) return new Promise(function(resolve, reject){  return resolve(plainText); });
	if(plainText.length < 10) plainText = plainText.repeat(12 - plainText.length);

	return sha256("349d" + plainText + "9d3458694307" + plainText.length + String(iv))
	  .then(function(salt) {
		var passphraseKey = new TextEncoder().encode(plainText),
			saltBuffer = new TextEncoder().encode(salt);
		return window.crypto.subtle.importKey('raw', passphraseKey, {
			name: 'PBKDF2'
		}, false, ['deriveBits', 'deriveKey'])
		  .then(function(key) {
			return window.crypto.subtle.deriveKey({
				"name": 'PBKDF2',
				"salt": saltBuffer,
				"iterations": 1000000 + plainText.length,
				"hash": 'SHA-256'
			}, key, {
				"name": 'AES-GCM',
				"length": 256
			}, true, ["encrypt", "decrypt"]);
		});
	});
} /* end derive() */


function dataUrlToBlob(strUrl) { // support util for converting bin arrays
	var parts = strUrl.split(/[:;,]/),
		type = parts[1],
		decoder = parts[2] == "base64" ? atob : decodeURIComponent,
		binData = decoder(parts.pop()),
		mx = binData.length,
		i = 0,
		uiArr = new Uint8Array(mx);
	for(i; i < mx; ++i) uiArr[i] = binData.charCodeAt(i);
	return new Blob([uiArr], {type: type});
} /* end dataUrlToBlob() */

	
// provide utils as methods:
return {
	encrypt: aesEnc, 
	decrypt: aesDec,
	derive:  derive,
};

}));
