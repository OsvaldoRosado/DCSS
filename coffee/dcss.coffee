# ----------------------- #
#  Dynamic CSS Scripting  #
#  Requires jQuery        #
# ----------------------- #

###
Copyright (c) 2014 Osvaldo Rosado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
###

window.DCSS ?= {}
window.DCSS.attributeHandlers ?= {}
window.DCSS.functionHandlers ?= {}
window.DCSS.parseData ?= []
window.DCSS.curRelAddress ?= "./"
window.DCSS.functionDefinition ?= /([\w-]+)\((("(.+?)")|('(.+?)'))\)/g
window.DCSS.functionArgumentDefinition ?= /('(.+?)'|"(.+?)")/g
window.DCSS.async ?= false
window.DCSS.staticPageContent ?= false
window.DCSS.overridejQueryCSS ?= true

(($) ->
	DCSS.Run ?= () ->
		# Check if we should override $.css
		if DCSS.overridejQueryCSS then $.fn.css = $.fn.dcss
		
		if DCSS.async then console.log "DCSS: Running Asynchronously" else console.log "DCSS: Running Synchronously"
		# Process all linked stylesheets
		$('link[rel="stylesheet"]').each () ->
			externalProcess = (data)->
				if data is undefined then return new Error("File could not be loaded")
				parseData = DCSS.Preprocess DCSS.Parse data
				if parseData.length>0 then DCSS.parseData.push [DCSS.curRelAddress, parseData]
			DCSS.curRelAddress = $(this).attr('href').substring(0, $(this).attr('href').lastIndexOf("/"));
			$.ajax {url:$(this).attr('href'),success:externalProcess,async:DCSS.async}	
		# Process all style elements
		$('style').each () ->
			DCSS.curRelAddress = "./"
			parseData = DCSS.Preprocess DCSS.Parse $(this).text()
			if parseData.length>0 then DCSS.parseData.push [DCSS.curRelAddress, parseData]
		
		for data in DCSS.parseData
			DCSS.curRelAddress = data[0]
			DCSS.Interpret data[1]
		
		DCSS.Refresh()
	
	DCSS.ReflowEvents = []
	
	DCSS.Refresh ?= () ->
		for event in DCSS.ReflowEvents
			DCSS.ReflowAttributeHandler event[0], event[1], event[2], event[3], event[4]
	
	DCSS.ReflowAttributeHandler ?= (type, selector, property, processedValue, DCSSObjects)->
		selector = $(selector)
		jQ = jQuery
		jQ.fn.css = jQ.fn._dcss_int
		selector.css = selector._dcss_int
		
		# Run DCSS on every DCSS Function
		for funct in DCSSObjects
			functionName = funct[0]
			functionArguments = funct[1]
			functionString = funct[2]
			
			# Run the function!
			do($=jQ,jQuery=jQ) ->
				val = DCSS.functionHandlers[functionName].apply(undefined, functionArguments)
				processedValue = processedValue.replace(functionString,val)
		
		# Evaluate the (D)CSS Attribute	
		if type == "custom" then do($=jQ,jQuery=jQ) -> DCSS.attributeHandlers[property] selector, processedValue
		else selector._dcss_int(property,processedValue)
			
	DCSS.Preprocess ?= (dcsData) ->
		DCSSData = []
		attributeCount = 0
		selectorCount = 0
		
		for object in dcsData
			selector = $(object.selector);
			if selector.length < 1 then continue;
			
			DCSSAttributes = [];
			
			# Find DCSS Functions and Attributes
			for attribute in object.attributes
				isDCSS = false
				while (funct = DCSS.functionDefinition.exec(attribute.value))?
					functionName = funct[1];
					
					if functionName == "url" or functionName == "calc" then continue # Special Cases
					if DCSS.functionHandlers[functionName]?
						isDCSS = true
						break
				
				if DCSS.attributeHandlers[attribute.property]?
					isDCSS = true
				if isDCSS
					attributeCount++
					DCSSAttributes.push attribute
			
			if DCSSAttributes.length > 0
				object.attributes = DCSSAttributes
				selectorCount++
				DCSSData.push object
	
		console.log "DCSS: Found "+attributeCount+" dynamic attributes across "+selectorCount+" selectors."
		return DCSSData
					
	DCSS.Interpret ?= (dcsData) ->
		if !dcsData then return
		if dcsData.length < 1 then return
		
		for object in dcsData
			selector = $(object.selector)
			if !selector then continue
			if selector.length < 1 then continue
			
			# Process DCSS Functions
			for attribute in object.attributes
				
				# Store these results so we never have to do costly string processing again
				DCSSObjects = []
				
				processedValue = attribute.value
				while (funct = DCSS.functionDefinition.exec(attribute.value))?
					functionString = funct[0]
					functionName = funct[1]
					functionValue = funct[2]
					functionArguments = [selector]
					while(argument = DCSS.functionArgumentDefinition.exec(functionValue))?
						# Handle quote types
						argument = if argument[2] then argument[2] else argument[3]
						functionArguments.push argument;
						
					if DCSS.functionHandlers[functionName]?
						DCSSObjects.push [functionName, functionArguments, functionString]
						
						
				if DCSS.attributeHandlers[attribute.property]?
					DCSS.ReflowEvents.push ["custom",object.selector,attribute.property,attribute.value,DCSSObjects]
				else
					# We do this to apply function values that may have been evaluated on standard attributes
					# We know we have to do this because otherwise the preprocessor would have culled it.
					DCSS.ReflowEvents.push ["standard",object.selector,attribute.property,attribute.value,DCSSObjects]
		return
			
	DCSS.Parse ?= (data)->
		if typeof data != "string" then return {}
		
		# Strip comments from the CSS
		data = data.replace(/\/\*.*?\*\//g,"");
	
		# Split into components
		sections = data.split("}");
	
		# Split components into requisite parts
		components = []
		for section in sections
	
			# Parse out the selector
			nc = {}
			parts = section.split("{");
			if parts.length < 2 then continue
			nc.selector = parts[0].replace(/[\t\n\r]/g,"").trim();
	
			# Parse out the commands
			nc.attributes = []
			lines = parts[1].split(/[\;\n]/);
			for line in lines
				cparts = line.split(":");
				if cparts.length < 2 then continue
				prop = cparts[0].replace(/[\t\n\r\ ]/g,"").trim();
				val = cparts[1].trim();
				nc.attributes.push {property: prop, value: val}
	
			# Add the components
			components.push nc
			
		return components;
	
	
	# Make it work automagically
	$(window).on "load", () ->
		DCSS.Run()
		if !DCSS.staticPageContent
			if MutationObserver?
				console.log "DCSS: Mutation Observers Enabled."
				observer = new MutationObserver (mutations) ->
					(()->DCSS.Refresh())
				observer.observe(document, {childList: true, subtree:true})
			else
				console.log "DCSS: Polling Enabled."
				setInterval (()->DCSS.Refresh()), 300
		else 
			console.log "DCSS: Running in static page mode."
	
	$(window).on "resize scroll touchmove", (()->DCSS.Refresh())
	
	# Function Handlers #
	DCSS.functionHandlers["match-max"] ?= (selector,matchElement,matchProperty) ->
		maxValue = $(matchElement).css(matchProperty);
		maxElem = matchElement;
		$(matchElement).each ()->
			value = $(this).css("matchProperty");
			if parseInt(value) > parseInt(maxValue) 
				maxValue = value;
				maxElem = this;
		return DCSS.functionHandlers["match"](selector,maxElem,matchProperty);
		
	DCSS.functionHandlers["match-min"] ?= (selector,matchElement,matchProperty) ->
		minValue = $(matchElement).css(matchProperty);
		minElem = matchElement;
		$(matchElement).each ()->
			value = $(this).css("matchProperty");
			if parseInt(value) < parseInt(minValue) 
				minValue = value;
				minElem = this;
		return DCSS.functionHandlers["match"](selector,minElem,matchProperty);
			
	DCSS.functionHandlers["match"] ?= (selector,matchElement,matchProperty) ->
		return $(matchElement).css(matchProperty);
		
	DCSS.functionHandlers["js"] ?= (selector,js) ->
		return eval(js);
	
	DCSS.functionHandlers["url"] ?= (selector,url) ->
		# This is to compensate for relative urls
		if url.indexOf("./") == 0 or url.indexOf("./") == 1
			return "url('"+DCSS.curRelAddress+"/"+url+"')"
		else
			return "url('"+url+"')"
	
	# Attribute Handlers #
	DCSS.attributeHandlers["-d-fill"] ?= (selector,value) ->
		switch value
			when "window"
				selector.css("position","fixed");
				selector.css("top","0");
				selector.css("left","0");
			when "container","window"
				selector.css("margin","0");
				selector.css("padding","0");
				apply = () ->
					selector.css("width","100%");
					selector.css("height","100%");
				setTimeout(apply,0);
				
	DCSS.attributeHandlers["-d-center"] ?= (selector,value) ->
		selector.each ()->
			selector = $(this)
			if selector.offsetParent() != selector.parent()
				selector.parent().css("position","relative");
			
			if value == "horizontal" or value == "both"
				selector.css("position","absolute");
				apply = ()->
					width = selector.outerWidth();
					parentWidth = selector.offsetParent().innerWidth();
					selector.css("left",(parentWidth/2)-(width/2)+"px");
				setTimeout(apply,0);
			if value == "vertical" or value == "both"
				selector.css("position","absolute");
				apply = ()->
					height = selector.outerHeight();
					parentHeight = selector.offsetParent().innerHeight();
					selector.css("top",(parentHeight/2)-(height/2)+"px");
				setTimeout(apply,0);
	return
) jQuery


##############################
# Some extra help for jQuery #
##############################
(($) ->
	$.fn._dcss_css = $.fn.css
	$.fn._dcss_int = (property,value) ->
		if value?
			selector = this.selector
			
			if !selector? || selector == ""
				return this._dcss_css(property,value)
			
			rule = selector+'{'+property+':'
			ruleValue = value+';}'
			css = rule+ruleValue
			if $("#DCSS_STYLE_HANDLER").length == 0
				$( "<style id='DCSS_STYLE_HANDLER'></style>" ).appendTo( "head" )
			
			cssText = $("#DCSS_STYLE_HANDLER").text()
			
			if cssText.indexOf(rule) != -1
				posStart = cssText.indexOf(rule)
				posEnd = cssText.indexOf('}',posStart)+1
				nText = cssText.substring(0,posStart)+css+cssText.substring(posEnd)
				$("#DCSS_STYLE_HANDLER").text(nText)
			else
				$("#DCSS_STYLE_HANDLER").append(css)
			return this
		else
			return this._dcss_css(property)
	$.fn.dcss = (property,value) ->
		if value?
			# Create CSS string
			css = this.selector+'{'+property+':'+value+';}'
			parseData = DCSS.Preprocess DCSS.Parse css
			if parseData.length>0
				DCSS.curRelAddress = "./"
				DCSS.Interpret parseData
				DCSS.parseData.push [DCSS.curRelAddress, parseData]
				return this
			else
				return this._dcss_css(property,value)
		else
			return this._dcss_css(property)
	return
) jQuery