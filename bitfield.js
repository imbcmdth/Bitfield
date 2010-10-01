// Bitfield Object:
// Usage:
//  new Bitfield(specification);
//  new Bitfield(specification, unknown_bits_flag);
//  new Bitfield(specification, bitfield);
//  new Bitfield(specification, bitfield, unknown_bits_flag);
//  new Bitfield(bitfield, specification);
//  new Bitfield(bitfield, specification, unknown_bits_flag);

var isArray = function(o) {
	return Object.prototype.toString.call(o) === '[object Array]'; 
};

Bitfield = function(configuration, bit_field, ignore_unknown_bits){
	var inner_value = 0;

	/* Move settings around because we allow a 'flexible' call style. */
	if (typeof configuration === "number") {
		inner_value = configuration;
		if (isArray(bit_field)) {
			configuration = bit_field;
		}
	} else if (typeof bit_field === "number") {
		inner_value = bit_field;
	} else if (typeof bit_field === "boolean") {
		ignore_unknown_bits = bit_field;
	}

	/* By now, if configuration isn't an array of objects, something is very wrong. */
	if (!isArray(configuration)) {
		throw "No proper bit-field specification found!"
	}

	/* Initialize the remaining scope-wide variables. */
	var inner_mask = 0;
	var null_mask = 0xFFFFFFFF;
	var bit_to_name = [];
	var bit_to_description = [];
	var name_to_bit = {};
	var allow_other_bits = ignore_unknown_bits || false;
	var number_of_bits = 0;
	
	/* A new scope, just to contain index. */
	(function(){
		var index = configuration.length;
		while (--index >= 0) {
			if(configuration[index].bit+1 > number_of_bits) number_of_bits = configuration[index].bit+1;
			bit_to_name[configuration[index].bit] = configuration[index].name;
			bit_to_description[configuration[index].bit] = configuration[index].description;
			name_to_bit[configuration[index].name] = configuration[index].bit;
			inner_mask |= (1<<configuration[index].bit);
		}
	}());

	/* If allow_other_bits is not set, we only allow 1's in bits that are in mentioned in the configuration. */
	inner_value &= (allow_other_bits ? null_mask : inner_mask); 

	var _getSize = function() {
		return number_of_bits;
	};

	var _getBitFromName = function(name) {
		if (typeof name_to_bit[name] != "undefined" && name_to_bit[name] != null) {
			return name_to_bit[name];
		} else {
			return false; // ERROR!
		}
	};

	var _getNameFromBit = function(bit) {
		if (bit !== false && bit >= 0 && bit < _getSize()) {
			if (typeof bit_to_name[bit] != "undefined" && bit_to_name[bit]) {
				return bit_to_name[bit];
			}
		} 
		return false; // ERROR!
	};

	var _getDescriptionFromBit = function(bit){
		if (bit !== false && bit >= 0 && bit < _getSize()) {
			if (typeof bit_to_description[bit] != "undefined" && bit_to_description[bit]) {
				return bit_to_description[bit];
			}
		}
		return false; // ERROR!
	};

	var _getBit = function(bit) {
		if (bit !== false && bit >= 0 && bit < _getSize()) {
			return ( (allow_other_bits ? null_mask : inner_mask) & this.valueOf() & (1<<bit) ) != 0;
		} else {
			return false;
		}
	};
	var _doIt = function(name, op){
		var bit = 1<<_getBitFromName(name);
		var new_value = this.valueOf();
		if (typeof name != "undefined" && _getBitFromName(name) !== false) {

			switch(op){
				case 'set':
					new_value |= bit;
					break;
				case 'clear':
					new_value &= ~bit;
					break;
				case 'toggle':
					new_value ^= bit;
					break;
			};
			new_value &= (allow_other_bits ? null_mask : inner_mask);

			if (this['setValueOf']) { 
				this.setValueOf(new_value); 
			}
			return new_value;
		} else {
			return false;
		}		
	}
	/* We have a valueOf function so that this object can act just like a regular number. */
	this.valueOf = function() {
		return inner_value.valueOf();
	};
	
	/* This toString allows to specify a length to pad to. 
	   Any number shorter than length will be prefixed by enough zeros to reach length. */
	this.toString = function(base, length) {
		base = base || 10;
		length = length || _getSize();
		var str = inner_value.toString(base);
		if (base === 2) {
			for (var i = length - str.length; i > 0; i--)
				str = "0" + str;
		}
		return str;
	};

	/* Just a helper function. */
	this.setValueOf = function(val) {
		var old_val = inner_value;
		if (val) inner_value = val;
		return old_val;
	};

	this.has = this.isset = function(name) {
			return _getBit.call(this, _getBitFromName(name));
	};

	this.set = function(name) {
		return _doIt.call(this, name, 'set');
	};

	this.unset = function(name) {
		return _doIt.call(this, name, 'clear');
	};

	this.toggle = function(name) {
		return _doIt.call(this, name, 'toggle');
	};

	this.each = function(fun, show_all){
		var show_all_bits = show_all || allow_other_bits || false;
		for (var i=0;i< (show_all_bits?32:_getSize());i++){ 
			if (show_all_bits || _getNameFromBit(i)) {
				fun.call(this, i, _getBit.call(this, i));
			}
		}
	};

	this.debug = function() {
		var out = "";
		var callback = function(bit, value) { 
			out += bit+" \t-\t";
			if (_getNameFromBit(bit)){
				if (value) {
					out += "1\t-\t"+_getNameFromBit(bit)+"\t-\t"+_getDescriptionFromBit(bit);
				} else {
					out += "0\t-\t"+_getNameFromBit(bit)+"\t-\t"+_getDescriptionFromBit(bit);
				}
			} else {
					out += "N/A";
			}
			out += "\n";
		};
		this.each.call(this, callback, true);
		return out;
	};
};
