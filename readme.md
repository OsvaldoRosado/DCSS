Dynamic CSS (DCSS)
==================

Dynamic CSS is **augmented** CSS. DCSS provides you with a way to extend CSS through Javascript with exceptional ease. Attributes and functions provided out-of-the-box alone solve many issues with CSS, such as handling constraints and vertical centering.

DCSS requires jQuery to work and is released under the MIT license.

Out-of-the-box Additions
------------------------
### Attributes
```
-d-fill: container|window
-d-center: horizontal|vertical|both
```

**Fill** makes the targeted element fill its container or the window. It is essentially a shorter way of specifying `margin:0;padding:0;width:100%;height:100%;`

**Center** makes the targeted element centered either horizontally, vertically, or both, within it's parent element. It does not matter what kind of display property the element has.

### Functions
```
match("SELECTOR","PROPERTY")
match-max("SELECTOR","PROPERTY")
match-min("SELECTOR","PROPERTY")
js("STRING")
```

**Match** and its sister functions match-max and match-min bind a property of an element to a property of another element. Modifiers max and min instruct DCSS to bind against the largest value that an element matching the selector had, or the smallest. For example, to make all columns the height of the tallest column, one could have the following CSS:
`.column{min-height: match-max(".column","height");}`

**JS** can be used to compute the value of a property using arbitrary Javascript. For example, to set the background color of an element to be a random color, one could have the following CSS:
`background-color: js("'#'+Math.floor(Math.random()*16777215).toString(16)");`

DCSS functions are completely transparent to CSS and can be used be used anywhere in any property. For example: `border: 1px solid match("#header","background-color")` will be processed as expected.


Custom DCSS
-----------
DCSS is incredibly easy to expand. There's almost no wall between your Javascript and the DCSS Interpreter. We'll show this by example. The examples used here can go in a script tag or in a Javascript file loaded after DCSS.
### Custom Attribute
Here's a basic attribute that allows one to set the border color and background color in one line.
```
function DCSS.attributeHandlers["-d-color"](selector,value){
    selector.css("background-color",value);
    selector.css("border-color",value);
}
```
Note that the `selector` argument passed to your function is a jQuery object.
### Custom Function
Here's a basic function that allows one to get a random pixel value from a start and end number.
```
function DCSS.functionHandlers["rand"](selector,start,end){
    return Math.floor(Math.random()*(end-start+1)+start)+"px";
}
```
The selector argument is still a jQuery object as before. Note that you can define any number of arbitrary arguments for your DCSS function to have by simply making your Javascript function have those arguments.
### End Result
By simply having those functions exist in your Javascript, and including DCSS and it's prerequisite, jQuery, a CSS file included on your page, or embedded in a style tag, with the following contents will now work.
```
#reallyCoolDiv{
    width: rand('20','50');
    height: rand('30','60');
    -d-color: #ff0000;
}
```