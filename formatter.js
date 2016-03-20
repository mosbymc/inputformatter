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

var formatter = (function($) {
    var deleteFlag = false;
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

    //This still isn't working due to difficulties in getting the pasted data in all browsers for both keyboard and mouse paste events.
    //Need to separate out the functionality so that the above listener gets the placement of the new character first, then formats the string. Then this new listener will
    //have a call the following function.

    //UPDATE: I think this 'input' event listener works for both mouse and keyboard paste events. So far I haven't had any trouble either with pasting or typing. Both
    //event handlers are catching the events that I want them to and seem to be handling everything correctly. Further testing needs to be done.
    //NOTE: After stepping through the code, when pasting, I belive I need to first clean the input as is being done with the keyup event. Otherwise
    //it will leave in the previously formatted characters if they match the char type for that location... effectively duplicating the
    //formatting chars.

    //This appears to work well with paste events, both mouse and keyboard, but the backspace is now messed up; and since this
    //is an input event, I can't get the charCode to know if it was the backspace key that was used. May have to go a different route.
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

    //I think this will take care of the delete and backspace problems from the input event listener above. However, I've also noticed some issues
    //with inserting a character in the middle of an input string rather than at the end. I need to check the 'stripFormatting', function
    //as I am fairly certain the issue resides within.

    //To make this work, I will need to find the cursor position, and if it is at the end and the character removed was a formatting
    //character, then all trailing formatting characters as well as the last input character will need to be removed from the current string.
    //If the cursor covers a spread of characters going to the end, then only those character should be removed

    //Get cursor position
    //if spread, only remove character in spread
    //else, remove the targetted char
    //if targetted char is the last format char in the string,
    //remove all formatting chars before it as well
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
                    patternArray = buildPatternArray(formatOptions.format),
                    cleanedInput;

                //If the last char in the input is of type 'format', and it is being deleted, remove all formatting chars
                //at the end of the input plus the last 'input' type char as well.
                if (cursorPos.start === target.val().length && patternArray[cursorPos.start-1].type === 'format') {
                    cleanedInput = stripFormatting(patternArray, target.val());
                    var test = cleanedInput.substring(0, cleanedInput.length-1);
                    formatInput(formatOptions, patternArray, test);
                }
                //If a range is selected in the input and that range doesn't include the last char, and the last char is of type
                //'format', remove the ending 'format' chars as well.
                else if ((cursorPos.start < cursorPos.end) && (cursorPos.end < target.val().length) && patternArray[target.val().length-1].type === 'format') {
                    var newVal = target.val().substring(0, cursorPos.start);
                    cleanedInput = stripFormatting(patternArray, newVal);
                    formatInput(formatOptions, patternArray, cleanedInput);
                }
                else {
                    var newFieldVal = deleteKey(formatOptions);
                    cleanedInput = stripFormatting(patternArray, newFieldVal);
                    formatInput(formatOptions, patternArray, cleanedInput);
                }
            }
        }
    });
    /*
     $(document).on("paste", "input", function(event){
     var isKeyUp = false;

     $(document).one("keyup", "input", function(event) {		//We only want to listen to the keyup event after a paste event
     isKeyUp = true;
     var target = $(event.currentTarget);
     if (target.data("inputformat") !== undefined) {
     var formatOptions = {
     input: target,							//The input that is being formatted
     format: target.data("inputformat"),		//The format supplied in the data-inputformat attribute of the DOM element
     event: event
     };
     var patternArray = buildPatternArray(formatOptions.format);		//builds an array for each value in the supplied format string in the data-inputformat value
     formatInput(formatOptions, patternArray, target.val());

     $(document).off("mouseup", "input");
     }
     });

     $(document).one("mouseup", "input", function(event) {		//We only want to listen to the keyup event after a paste event
     var target = $(event.currentTarget);
     if (target.data("inputformat") !== undefined) {
     var formatOptions = {
     input: target,							//The input that is being formatted
     format: target.data("inputformat"),		//The format supplied in the data-inputformat attribute of the DOM element
     event: event
     };
     var patternArray = buildPatternArray(formatOptions.format);		//builds an array for each value in the supplied format string in the data-inputformat value
     formatInput(formatOptions, patternArray, target.val());

     $(document).off("keyup", "input");
     }
     });
     });*/

    function verifyChar(options) {
        var patternArray = buildPatternArray(options.format),	//builds an array for each value in the supplied format string in the data-inputformat value
            newUserVal = insertKey(options),	//value the user wants to have with the current key inserted into the correct position in the existing string - takes into account a highlight-replace operation
            cleanedInput = newUserVal.length > 1 ? stripFormatting(patternArray, newUserVal) : newUserVal;

        formatInput(options, patternArray, cleanedInput);
    }

    function formatInput(options, patternArray, inputVal) {
        var formattedVal = stringBuilder(inputVal, patternArray);
        options.input.val(formattedVal);
        options.event.preventDefault();
    }

    function stringBuilder(inputVal, stringPattern) {		//Builds out the string that will be placed in the input
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
                    //var tempString = inputVal.substring(0, charCount) + inputVal.substring(charCount+1);
                    //inputVal = tempString;
                }
            }
        }
        return inputAdded === true ? formattedString : "";	//don't want to return a string that has no input characters in it
    }

    function validChar(patternIndex, stringPattern, inputIndex, inputVal) {
        var regexVal = new RegExp(getRegexVal(stringPattern[patternIndex].value)),
            testChar = inputVal[inputIndex];
        return regexVal.test(testChar);		//return true/false based on the test result
    }

    function buildPatternArray(formatString) {	//Builds out an array using the format provided in the data-inputformat attribute of the DOM element
        var matcher = [];								//Each character is denoted whether it is part of the format of just user input based on the "{{" and "}}" delimiters

        for (var i = 0; i < formatString.length; i++) {
            if (formatString[i] === "{" && formatString[i+1] === "{") {
                for (var j = i+2; j < formatString.length-1; j++) {
                    if (formatString[j] === "}" && formatString[j+1] === "}") {
                        i = j+1;
                        break;
                    }
                    else {
                        matcher.push({ value: formatString[j], type: "input" });
                    }
                }
            }
            else {
                matcher.push({ value: formatString[i], type: "format" });
            }
        }
        return matcher;
    }

    function getRegexVal(character) {	//returns the regex value given a specific character as defined in the data-inputformat attributes
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
    }

    function insertKey(options) {		//Inserts the new character to it's position in the string based on cursor position
        var loc = getInputSelection(options.input[0]);
        return options.input.val().substring(0, loc.start) + options.key + options.input.val().substring(loc.end, options.input.val().length);
    }

    function deleteKey(options) {
        var loc = getInputSelection(options.input[0]);
        return options.input.val().substring(0, loc.start-1) + options.input.val().substring(loc.end, options.input.val().length);
    }

    function stripFormatting(formatString, fieldVal) {
        var strippedVal = "";

        for (var i = 0; i < formatString.length; i++) {
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
    }

    function getInputSelection(el) {		//Finds the cursor position in the input string - includes highlighted ranges.
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

    function getFormattedInput(format, input) {
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

    function removeFormatting(input) {
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

    return {
        getFormattedInput: getFormattedInput,
        removeFormatting: removeFormatting
    };
})(jQuery);
