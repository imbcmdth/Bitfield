// Bitfield Object:
// Usage:
//  new Bitfield(specification);
//  new Bitfield(specification, unknown_bits_flag);
//  new Bitfield(specification, bitfield);
//  new Bitfield(specification, bitfield, unknown_bits_flag);
//  new Bitfield(bitfield, specification);
//  new Bitfield(bitfield, specification, unknown_bits_flag);


Bitfield = function(configuration, bit_field, ignore_unknown_bits){

	/* Initialize most scope-wide variables. */
	var inner_value = null;
	var inner_mask = 0;
	var null_mask = 0xFFFFFFFF;
	var bit_to_name = [];
	var bit_to_description = [];
	var name_to_bit = {};
	var number_of_bits = 0;
	var isArray = function(o) {
		return Object.prototype.toString.call(o) === '[object Array]'; 
	};


	/* Move settings around if needed.
	   We do this because we allow a 'flexible' call style. */
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

	/* By now, if configuration isn't an array of objects, something is very wrong. 
	   So I throw my hands in the air like I just don't care.
	*/
	if (!isArray(configuration) || configuration.length < 1) {
		throw "No proper bit-field specification found!"
	}

	/* Initialize the remaining scope-wide variables. */
	var allow_other_bits = ignore_unknown_bits || false;
	
	/* A temporary scope, just to contain "index". */
	(function(){
		var index = configuration.length;
		var curbit = 0;
		while (--index >= 0) {
			curbit = configuration[index].bit;
			if (curbit+1 > number_of_bits) {
				number_of_bits = curbit+1;
			}
			bit_to_name[curbit] = configuration[index].name;
			bit_to_description[curbit] = configuration[index].description;
			name_to_bit[configuration[index].name] = curbit;
			inner_mask |= (1<<curbit);
		}
	}());

	/* If allow_other_bits is not set, we only allow 1's in bits that are in mentioned in the configuration. */
	if(inner_value !== null){
		inner_value &= (allow_other_bits ? null_mask : inner_mask); 
	}

	var _getSize = function() {
		return number_of_bits;
	};

	var _getAllNames = function(){
		var names = [];
		var name;
		for(name in name_to_bit){
			if(name_to_bit.hasOwnProperty(name))
				names.push(name);
		}
		return names.reverse();
	};

	var _getAllBits = function(){
		var bits = [];
		var i = bit_to_name.length;
		while (--i >= 0) {
			bits.push(i);
		}
		return bits.reverse();
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
		if (this && bit !== false && bit >= 0 && bit < _getSize()) {
			return ((allow_other_bits ? null_mask : inner_mask) & (this.valueOf() & (1<<bit)))?this:false;
		}
		return false;
	};

	var _doIt = function(op, name){
		var new_value = this.valueOf();
		var bit = 0;
		var i = 0;
		if (arguments.length > 2) {
			name = Array.prototype.slice.call(arguments, 1);
		} 
		if (!isArray(name)) {
			name = [name];
		}
		i = name.length;
		while (--i>=0) {
			if (typeof name[i] != "undefined" && _getBitFromName(name[i]) !== false) {
				bit = 1<<_getBitFromName(name[i]);
				switch (op) {
					case 'set':
						new_value |= bit;
						break;
					case 'clear':
						new_value &= ~bit;
						break;
					case 'toggle':
						new_value ^= bit;
						break;
				}
				new_value &= (allow_other_bits ? null_mask : inner_mask);
			}
		}
		return new_value;
	};

	var _each = function(fun, show_all){
		var show_all_bits = show_all || allow_other_bits || false;
		for (var i=0;i< (show_all_bits?32:_getSize());i++){ 
			if (show_all_bits || _getNameFromBit(i)) {
				fun.call(this, i, _getBit.call(this.valueOf(), i));
			}
		}
	};

	// This is the inner object that is either returned or evaluated
	var BITFIELD = function(bit_field){
		bit_field &= (allow_other_bits ? null_mask : inner_mask); 
		bit_field = new Number(bit_field || 0);

		bit_field.oldValueOf = bit_field.valueOf;
		bit_field.valueOf = function() {
			return bit_field.oldValueOf()+0;
		};

		/* This toString allows to specify a length to pad to. 
		   Any number shorter than length will be prefixed by enough zeros to reach length. */
		bit_field.oldToString = bit_field.toString;
		bit_field.toString = function(base, length) {
			base = base || 10;
			length = length || 0;
			var str = bit_field.oldToString.call(bit_field, base);
			if (length > 0) {
				for (var i = length - str.length; i > 0; i--)
					str = "0" + str;
			}
			return str;
		};

		/* has - tests for the presence of one or more flags.
		   returns true if they are all present or false if any are missing.
		*/
		bit_field.has = bit_field.isSet = function(name) {
			if(arguments.length > 1){
				name = Array.prototype.slice.call(arguments);
			}
			if(!isArray(name)){
				name = [name];
			}
			var i = name.length;
			while(--i>=0){
				if(!_getBit.call(bit_field, _getBitFromName(name[i])))
					return false;
			}
			return true;
		};

		/* none - tests for the presence of none of the flags.
		   returns true only if none are present or false if any are set.
		*/
		bit_field.none = bit_field.notSet = function(name) {
			if(arguments.length > 1){
				name = Array.prototype.slice.call(arguments);
			}
			if(!isArray(name)){
				name = [name];
			}
			var i = name.length;
			while(--i>=0){
				if(_getBit.call(bit_field, _getBitFromName(name[i])))
					return false;
			}
			return true;
		};

		/* only - make sure only the specified flags are set
		*/
		bit_field.only = function(name) {
			var flags = _getAllNames();

			if(arguments.length > 1){
				name = Array.prototype.slice.call(arguments);
			}
			if(!isArray(name)){
				name = [name];
			}
			var i = name.length;
			while(--i>=0){
				var index = flags.indexOf(name[i]);
				flags.splice(index, 1);
			}
			return  bit_field.has(name) && bit_field.none(flags);
		};

		bit_field.set = function(name) {
			var args = isArray(name)?name:Array.prototype.slice.call(arguments);
			return BITFIELD(_doIt.call(bit_field, 'set', args));
		};

		bit_field.unset = function(name) {
			var args = isArray(name)?name:Array.prototype.slice.call(arguments);
			return BITFIELD(_doIt.call(bit_field, 'clear', args));
		};

		bit_field.toggle = function(name) {
			var args = isArray(name)?name:Array.prototype.slice.call(arguments);
			return BITFIELD(_doIt.call(bit_field, 'toggle', args));
		};

		bit_field.each = function(fun, show_all){
			_each.call(bit_field, fun, show_all);
		};

		bit_field.name = function(bit){
			return _getNameFromBit(bit);
		};

		bit_field.flags = function(){
			return _getAllNames();
		};

		bit_field.bits = function(){
			return _getAllBits();
		};

		bit_field.description = function(bit){
			return _getDescriptionFromBit(bit);
		};

		bit_field.debug = function() {
			var out = "";
			var callback = function(bit, value) { 
				out += bit+" \t-\t";
				if (this.name(bit)){
					if (value) {
						out += "1\t-\t"+this.name(bit)+"\t-\t"+this.description(bit);
					} else {
						out += "0\t-\t"+this.name(bit)+"\t-\t"+this.description(bit);
					}
				} else {
						out += "N/A";
				}
				out += "\n";
			};
			bit_field.each(callback, true);
			return out;
		};

		// Finally, return the decorated Number();
		return bit_field;
	};

	BITFIELD.flags = function(){
		return _getAllNames();
	};

	BITFIELD.bits = function(){
		return _getAllBits();
	};

	if(inner_value !== null)
		return BITFIELD(inner_value);
	else
		return BITFIELD;
};