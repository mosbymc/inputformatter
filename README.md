inputformatter
==============

A JQuery 1.7+ dependent formatting tool for web form input fields - can be used in conjunction with [validator.js](https://github.com/mosbymc/validator) or as stand-alone tool.

The wiki for this repo contains the documentation on how to use formatter.js.

The formatter will take read a data-attribute on HTML input elements and determine the format of characters as well as what character are allowed in each space as specified in the data-attribute. The formatter.html file is a test page that I've made to test the functionality of the formatter as I built it. The file form.css should be used with the test page to style it, but it is not needed when including the formatter in your own project. Feel free to play around with the html page and try out different formats.

The formatter was originally concieved to be a part of the code in my other repo [validator.js](https://github.com/mosbymc/validator), but due to the additional size and the amount of work required, it is now a stand-alone tool that can be used with or without the validator. However, both are concieved to work similarly in that they use classes and attributes to drive the functionality. If you like the way to formatter works, be sure to check out the validator as well.


# **formatter.js**


The formatter currently works on the keypress and paste events to format input by the user in a text input. To use the formatter, first it must be initialized. To do so, call the init function on the formatter.
```javascript
    formatter().init();
```
Each input that you want to be formatted needs an attribute called "data-inputformat", the value of which should be set to the format you would like to have. 
```html
    <input type="text" id="fv1homephone" data-inputformat="({{###}}) {{###}}-{{####}}"/>
```
In the future, I plan on the formatter supporting regex as well as a simplified pattern scheme, but for the time being, it only supports the simply pattern scheme.

**Pattern Scheme**

'{{' and '}}' - used to delimit areas of user input. The characters below are the valid types that can be specified inside the double brackets to restrict user input. Any special characters inside the double brackets will be treated as a regex value to test the user's input at that location in the string*. Anything not inside the double brackets will be treated a a literal value and added to the form input as the user types.

'#' - any single digit

'a' - any word character (alphanumeric)

'Z' - any single upper or lower case character

'@' - any non-word character (non-alphanumeric)

'd' - and non-digit character

's' - any non-whitespace character

'*' - wildcard; any character

*Note: If you put a character inside the double brackets that is not in the list above, the formatter will treat it as a literal value, meaning the user must type that specific character at that position in the string, all other values will be ignored. Essentially, this would be equivalent to closing the double brackets and putting that same character outside them. The only difference being that in the later case, the formatter would automatically fill that value in for the user.
