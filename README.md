# grain

Module management library like requirejs  

## Usage

### Main Only

```HTML
<script src="grain.js"></script>
<script src="app.js"></script>
```

* `app.js`

Register the function in `Grain(dependencies, fn)`. Even if there is no dependency, `dependencies` is required.

```Javascript
Grain([
	// no dependencies
], function() {
	console.log('Document ready!');
});
```

Functions that have been registered will be executed `DOMContentLoaded` event.

### Use module

```HTML
<script src="grain.js"></script>
<script src="module.js"></script>
<script src="app.js"></script>
```

* `module.js`

Define the module in `Grain.define(id, dependencies, fn)`.

```Javascript
Grain.define('the/great/module', [
], function() {
	return {
		name: 'TheGreadModule'
	};
});
```

* `app.js`

```Javascript
Grain([
	'the/great/module'
], function(module) {
	console.log(module.name, 'is loaded');
});
```

### File which is concat

```HTML
<script src="grain.js"></script>
<script src="app.js"></script>
```

* `app.js`

Does not matter the order of processing.

```Javascript
Grain([
	'the/ultra/great/module'
], function(module) {
	console.log(module.name, 'is loaded');
});

Grain.define('model/ultra', [
], function() {
	return {
		value: 'Ultra'
	};
});

Grain.define('the/ultra/great/module', [
	'model/ultra',
	'model/great'
], function(ultra, great) {
	return {
		name: 'the' + ultra.value + great.value + 'Module'
	};
});

Grain.define('model/great', [
], function() {
	return {
		value: 'Great'
	};
});
```

### Mixin

```HTML
<script src="grain.js"></script>
<script src="mixin.js"></script>
<script src="app.js"></script>
```

* `mixin.js`

Mixin the module in `Grain.mixin(object)`. Mixin object key is definition name.

```Javascript
Grain.mixin({
	'model': [
		'model/ultra',
		'model/great'
	]
});

Grain.define('model/ultra', [
], function() {
	return {
		value: 'Ultra'
	};
});

Grain.define('model/great', [
], function() {
	return {
		value: 'Great'
	};
});
```

* `app.js`

Being converted into camel case variables separated by `"/"`.

```Javascript
Grain.define('the/ultra/great/module', [
	'model'
], function(obj) {
	return {
		name: 'the' + obj.modelUltra.value + obj.modelGreat.value + 'Module'
	};
});

Grain([
	'the/ultra/great/module'
], function(module) {
	console.log(module.name, 'is loaded');
});
```

## Reference

### Example using backbone.js

```Javascript
Grain.define('post/input', [
	'util/date',
	'view/alert'
], function(Util, Alert) {
	var InputView = Backbone.View.extend({
		events: {
			'click': 'onClick'
		},
		onClick: function(e) {
			var alert = new Alert.View();
			alert.show({
				text: Util.format(new Date())
			});
		}
	});

	return {
		View: InputView
	};
});
```

```Javascript
Grain.mixin({
	'common': [
		'util/date',
		'util/string',
		'util/number'
	]
});
```

```Javascript
Grain([
	'common',
	'post/input'
], function(Common, Input) {
	var Content = Backbone.View.extend({
	});
	
	new Input();
	new Content();
});
```
