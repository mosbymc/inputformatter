/*
formatter.js


The MIT License (MIT) 
Copyright © 2014

Permission is hereby granted, free of charge, to any person obtaining a copy of this 
software and associated documentation files (the “Software”), to deal in the Software 
without restriction, including without limitation the rights to use, copy, modify, merge, 
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or 
substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
{{user input}}
any one digit: # = \d
zero or one digit: 0 = \d?
any one alphabetic character: Z = [a-z,A-Z]
zero or one alphabetic character: a = [a-z,A-Z]?
any character: * = .

- need spaces and special characters
- preferably have one character specifiers

phone number = ({{###}}) {{###}}-{{####}} = /({{\d\d\d}}) {{\d\d\d}}-{{\d\d\d\d}}/
*/

var formatter = function() {
	this.init = function() {
		$(document).on("keypress", "input", function(event) {   //Bind event listener for the keypress event on an input.
            var target = event.currentTarget;
            var key = String.fromCharCode(event.keyCode);
            if (($(target).hasClass("restrictInput") || $(target).parents(".formValidate:first").hasClass("restrictInput")) && $(target).data("inputformat") !== undefined) {
                var formatOptions = {
                    input: $(target),							//The input that is being formatted
                    key: key,									//The value of the key that was entered
                    format: $(target).data("inputformat")		//The format supplied in the data-inputformat attribute of the DOM element
                };
                verifyChar(formatOptions, event);
            }
        });
	}

	var verifyChar = function(options, event) {
		var patternArray = buildPatternArray(options.format);
		var newUserVal = insertKey(options);	//value the user wants to have with the current key inserted into the correct position in the existing string - takes into account a highlight-replace operation
		var formattedVal = stringBuilder(newUserVal, patternArray);

		options.input.val(formattedVal);
		event.preventDefault();	//Don't allow the currently event to go through - prevents the character from appearing twice in the case of acceptable chars and once in the case on unacceptable chars
	};

	var stringBuilder = function(inputVal, stringPattern) {		//Builds out the string that will be placed in the input
		var charCount = 0;
		var formattedString = "";
		for (var i = 0; i < stringPattern.length; i++) {
			if (charCount >= inputVal.length && stringPattern[i].type !== "format") {
				break;
			}
			while (charCount <= inputVal.length) {
				if (stringPattern[i].type === "format") {	//If the current type is a "format", go ahead and add it to the string
					formattedString += stringPattern[i].value;
					break;				
				}
				else if (stringPattern[i].type === "input" && validChar(i, stringPattern, charCount, inputVal)) {	//If the current type is an "input" and the current inputVal is a valid character, add it to the string
					formattedString += inputVal[charCount];
					charCount++;
					break;
				}
				else if (stringPattern[i].type === "input" && !validChar(i, stringPattern, charCount, inputVal)) {	//If the current type is an "input" and the current inputVal is not a valid character, remove it from the input string
					var tempString = inputVal.substring(0, charCount) + inputVal.substring(charCount+1);
					inputVal = tempString;
				}
			}
		}
		return formattedString;
	};

	var validChar = function(patternIndex, stringPattern, inputIndex, inputVal) {
		var regexVal = new RegExp(getRegexVal(stringPattern[patternIndex].value));
		var testChar = inputVal[inputIndex];
		return regexVal.test(testChar);		//return true/false based on the test result
	};

	var buildPatternArray = function(formatString) {	//Builds out an array using the format provided in the data-inputformat attribute of the DOM element
		var matcher = [];								//Each character is denoted whether it is part of the format of just user input based on the "{{" and "}}" delimiters
		var tempPattern = "";
		var tempForm = "";

		for (var i = 0; i < formatString.length-1; i++) {
			if (formatString[i] === "{" && formatString[i+1] === "{") {
				for (var j = i+2; j < formatString.length-1; j++) {
					if (formatString[j] === "}" && formatString[j+1] === "}") {
						i = j+1;
						break;
					}
					else {
						matcher.push({
							value: formatString[j],
							type: "input"
						});
					}
				}
			}
			else {
				matcher.push({
					value: formatString[i],
					type: "format"
				});
			}
		}

		return matcher;
	};

	var getRegexVal = function(format) {	//returns the regex value given a specific character as defined in the data-inputformat attribute
		switch (format) {
			case "#":
				return "\\d";			//any digit
			case "0":
				return "\\d?";			//zero or one digit
			case "Z":
				return "[a-z,A-Z]";		//any upper or lower case character
			case "a":
				return "[a-z,A-Z]?";	//zero or one upper or lower case character
			case "*":
				return ".";				//any character at all - wildcard
			default:
				return format;
		}
	};

	var insertKey = function(options) {		//Inserts the new character to it's position in the string based on cursor position
		var loc = getInputSelection(options.input[0]);
		var val = options.input.val().substring(0, loc.start) + options.key + options.input.val().substring(loc.end, options.input.val().length);
		return val;
	};

	var getInputSelection = function(el) {		//Finds the cursor position in the input string - includes highlighted ranges.
	    var start = 0, end = 0, normalizedValue, range,
	        textInputRange, len, endRange;

	    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
	        start = el.selectionStart;
	        end = el.selectionEnd;
	    } else {
	        range = document.selection.createRange();

	        if (range && range.parentElement() == el) {
	            len = el.value.length;
	            normalizedValue = el.value.replace(/\r\n/g, "\n");

	            // Create a working TextRange that lives only in the input
	            textInputRange = el.createTextRange();
	            textInputRange.moveToBookmark(range.getBookmark());

	            // Check if the start and end of the selection are at the very end
	            // of the input, since moveStart/moveEnd doesn't return what we want
	            // in those cases
	            endRange = el.createTextRange();
	            endRange.collapse(false);

	            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
	                start = end = len;
	            } else {
	                start = -textInputRange.moveStart("character", -len);
	                start += normalizedValue.slice(0, start).split("\n").length - 1;

	                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
	                    end = len;
	                } else {
	                    end = -textInputRange.moveEnd("character", -len);
	                    end += normalizedValue.slice(0, end).split("\n").length - 1;
	                }
	            }
	        }
	    }

	    return {
	        start: start,
	        end: end
	    };
	}

	return this;
}