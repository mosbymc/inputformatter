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

{{user input}}
any digit character: # = \d
any word character: a = \w
any alphabetic character: Z = [a-z,A-Z]
any non-word character:  @ = \W
any non-digit character: d = \D
any non-whitespace character: s = \S
any character: * = .

- need spaces and special characters
- preferably have one character specifiers

phone number = ({{###}}) {{###}}-{{####}} = /({{\d\d\d}}) {{\d\d\d}}-{{\d\d\d\d}}
*/

var formatter = function() {
	var deleteFlag = false;

	this.init = function() {
		//Normal single key input event listener
		$(document).on("keypress", "input", function(event) {   //Bind event listener for the keypress event on an input.
            var target = $(event.currentTarget),
            code = event.charCode? event.charCode : event.keyCode,
            key = String.fromCharCode(code);
            if (target.data("inputformat") !== undefined) {
                var formatOptions = {
                    input: target,							//The input that is being formatted
                    key: key,									//The value of the key that was entered
                    format: target.data("inputformat"),		//The format supplied in the data-inputformat attribute of the DOM element
                    event: event
                };
                verifyChar(formatOptions);
            }
        });
		//Event listener for pasting. The actual paste event does not allow access to the clipboard so during a mouse paste event
		//you cannot determine what characters are being pasted. I've tried other work arounds with this, but just waiting for the
		//input event gave the most control.
        $(document).on("input", "input", function(event) {
        	if (deleteFlag) {
        		deleteFlag = false;
        		return;
        	}
        	var target = event.currentTarget;
			if (($(target).hasClass("formatInput") || $(target).parents(".formatInput:first")) && $(target).data("inputformat") !== undefined) {
                var formatOptions = {
                    input: $(target),							//The input that is being formatted
                    format: $(target).data("inputformat"),		//The format supplied in the data-inputformat attribute of the DOM element
                    event: event
                };
                var patternArray = buildPatternArray(formatOptions.format);
                var cleanedInput = stripFormatting(patternArray, $(target).val());
                formatInput(formatOptions, patternArray, cleanedInput);
            }
        });

        //Using the keydown event for delete/backspace characters. The keypress event doesn't catch this characters in all browers.
        //Using the deleteFlag to keep the input event listener from also acting on the new input value after this one.
        $(document).on('keydown', 'input', function(event) {
        	var target = $(event.currentTarget),
        	code = event.charCode? event.charCode : event.keyCode;
        	if ((code === 8 || code === 46) && target.val().length > 0) {
        		if ((target.hasClass("formatInput") || target.parents(".formatInput:first")) && target.data("inputformat") !== undefined) {
        			deleteFlag = true;
	                var formatOptions = {
	                    input: target,							//The input that is being formatted
	                    format: target.data("inputformat"),		//The format supplied in the data-inputformat attribute of the DOM element
	                    key: "",
	                    event: event
	                };
	                var cursorPos = getInputSelection(target[0]),
	                patternArray = buildPatternArray(formatOptions.format);

	                //If the last char in the input is of type 'format', and it is being deleted, remove all formatting chars
	                //at the end of the input plus the last 'input' type char as well.
	                if (cursorPos.start === target.val().length && patternArray[cursorPos.start-1].type === 'format') {
	                	var cleanedInput = stripFormatting(patternArray, target.val());
	                	var test = cleanedInput.substring(0, cleanedInput.length-1);
	                	formatInput(formatOptions, patternArray, test);
	                }
	                //If a range is selected in the input and that range doesn't include the last char, and the last char is of type
	                //'format', remove the ending 'format' chars as well.
	                else if ((cursorPos.start < cursorPos.end) && (cursorPos.end < target.val().length) && patternArray[target.val().length-1].type === 'format') {
	                	var newVal = target.val().substring(0, cursorPos.start);
	                	var cleanedInput = stripFormatting(patternArray, newVal);
	                	formatInput(formatOptions, patternArray, cleanedInput);
	                }
	                else {
	                	var newFieldVal = deleteKey(formatOptions);
		                var cleanedInput = stripFormatting(patternArray, newFieldVal);
		                formatInput(formatOptions, patternArray, cleanedInput);
	                }
	            }
        	}
        });
	}

	var verifyChar = function(options) {
		var patternArray = buildPatternArray(options.format),	//builds an array for each value in the supplied format string in the data-inputformat value
		newUserVal = insertKey(options),	//value the user wants to have with the current key inserted into the correct position in the existing string - takes into account a highlight-replace operation
		cleanedInput = newUserVal.length > 1 ? stripFormatting(patternArray, newUserVal) : newUserVal;

		formatInput(options, patternArray, cleanedInput);
	};

	var formatInput = function(options, patternArray, inputVal) {
		var formattedVal = stringBuilder(inputVal, patternArray);
		options.input.val(formattedVal);
		options.event.preventDefault();
	};

	var stringBuilder = function(inputVal, stringPattern) {		//Builds out the string that will be placed in the input
		var charCount = 0,			//where the loop is at in the input value
		formattedString = "",	//return value after formatting is added
		lastFailed = false, 	//used to flag if the last attempted character was not added - we don't want to add more trailing formatting characters if it did
		inputAdded = false;

		for (var i = 0; i < stringPattern.length; i++) {
			if (charCount >= inputVal.length && stringPattern[i].type !== "format") {
				break;	//get out of loop, we're done
			}
			else if (charCount >= inputVal.length && stringPattern[i].type === "format" && formattedString.length <= i && !lastFailed) {
				formattedString += stringPattern[i].value;		//add trailing format characters
			}
			while (charCount < inputVal.length) {
				if (stringPattern[i].type === "format") {	//If the current type is a "format", go ahead and add it to the string
					formattedString += stringPattern[i].value;
					lastFailed = false;
					break;				
				}
				else if (stringPattern[i].type === "input" && validChar(i, stringPattern, charCount, inputVal)) {	//If the current type is an "input" and the current inputVal is a valid character, add it to the string
					formattedString += inputVal[charCount];
					charCount++;
					lastFailed = false;
					inputAdded = true;
					break;
				}
				else if (stringPattern[i].type === "input" && !validChar(i, stringPattern, charCount, inputVal)) {	//If the current type is an "input" and the current inputVal is not a valid character, remove it from the input string
					charCount++;
					lastFailed = true;
				}
			}
		}
		return inputAdded === true ? formattedString : "";	//don't want to return a string that has no input characters in it
	};

	var validChar = function(patternIndex, stringPattern, inputIndex, inputVal) {
		var regexVal = new RegExp(getRegexVal(stringPattern[patternIndex].value)),
		testChar = inputVal[inputIndex];
		return regexVal.test(testChar, "i");		//return true/false based on the test result
	};

	var buildPatternArray = function(formatString) {	//Builds out an array using the format provided in the data-inputformat attribute of the DOM element
		var matcher = [],								//Each character is denoted whether it is part of the format of just user input based on the "{{" and "}}" delimiters
		tempPattern = "",
		tempForm = "";

		for (var i = 0; i < formatString.length; i++) {
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

	var getRegexVal = function(character) {	//returns the regex value given a specific character as defined in the data-inputformat attributes
		switch (character) {
			case "#":
				return "\\d";			//any digit
			case "d":
				return "\\D";			//any non-digit character
			case "Z":
				return "[a-z,A-Z]";		//any upper or lower case character
			case "a":
				return "\\w";			//any word character
			case "@":
				return "\\W";			//any non-word character
			case "s":
				return "\\S";			//any non-whitespace character
			case "*":
				return ".";				//any character at all - wildcard
			default:
				return character;
		}
	};

	var insertKey = function(options) {		//Inserts the new character to it's position in the string based on cursor position
		var loc = getInputSelection(options.input[0]);
		return options.input.val().substring(0, loc.start) + options.key + options.input.val().substring(loc.end, options.input.val().length);
	};

	var deleteKey = function(options) {
		var loc = getInputSelection(options.input[0]);
		return options.input.val().substring(0, loc.start-1) + options.input.val().substring(loc.end, options.input.val().length);
	};

	var stripFormatting = function(formatString, fieldVal) {
		var strippedVal = "",
		count = 0,
		numChars = fieldVal.length,
		index = 0;

		for (var i = 0; i < formatString.length; i++) {
			var temp = fieldVal.charAt(index);
			if (formatString[i].type === "input") {
				strippedVal += fieldVal.substr(i,1);
			}
			else if (formatString[i].type === 'format' && formatString[i].value !== fieldVal.charAt(i)) {
				strippedVal += fieldVal.substr(i,1);
			}

			if (i === fieldVal.length) {
				break;
			}
		}
		return strippedVal;
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

	this.getFormattedInput = function(format, input) {
		var elem = $("#" + input),
		patternArray = buildPatternArray(format),	//builds an array for each value in the supplied format string in the data-inputformat value
		curFormat = elem.data("inputformat"),
		cleanedInput;

		if (curFormat !== undefined) {
			cleanedInput = elem.val().length > 1 ? stripFormatting(buildPatternArray(curFormat), elem.val()) : elem.val();
		}
		else {
			cleanedInput = elem.val();
		}

		return stringBuilder(cleanedInput, patternArray);
	}

	this.removeFormatting = function(input) {
		var elem = $("#" + input),
		format = elem.data("inputformat"),
		cleanedString;

		if (format !== undefined) {
			cleanedString = stripFormatting(buildPatternArray(format), elem.val());
		}
		else {
			cleanedString = elem.val();
		}
		return cleanedString;
	}

	return this;
}
