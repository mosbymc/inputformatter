inputformatter
==============

A JQuery 1.7+ dependent formatting tool for web form input fields - can be used as an extension for [validator.js](https://github.com/mosbymc/validator) or as stand-alone tool.

The wiki for this repo contains the documentation on how to use formatter.js.

The formatter will take read a data-attribute on HTML input elements and determine the format of characters as well as what character are allowed in each space as specified in the data-attribute. The formatter.html file is a test page that I've made to test the functionality of the formatter as I built it. The file form.css should be used with the test page to style it, but it is not needed when including the formatter in your own project. Feel free to play around with the html page and try out different formats.

The formatter was originally concieved to be a part of the code in my other repo [validator.js](https://github.com/mosbymc/validator), but due to the additional size and the amount of work required, it is now a stand-alone tool that can be used with or without the validator. However, both are concieved to work similarly in that they use classes and attributes to drive the functionality. If you like the way to formatter works, be sure to check out the validator as well.
