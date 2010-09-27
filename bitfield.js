// Bitfield Object:

Bitfield = function(configuration, bit_field, unknown_bits){
	var inner_value = (typeof bit_field === "number")? bit_field : 0;
	var inner_mask = 0;
	var null_mask = 0xFFFFFFFF;
	var bit_to_name = [];
	var bit_to_description = [];
	var name_to_bit = {};
	var allow_other_bits = unknown_bits || false;
	var number_of_bits = 0;
	
	(function(){
		var index = spec.length;
		while (--index >= 0) {
			if(configuration[index].bit+1 > number_of_bits) number_of_bits = configuration[index].bit+1;
			bit_to_name[configuration[index].bit] = configuration[index].name;
			bit_to_description[configuration[index].bit] = configuration[index].description;
			name_to_bit[configuration[index].name] = configuration[index].bit;
			inner_mask |= (1<<configuration[index].bit);
		}
	}());

	// If allow_other_bits is not set,
	// we only allow 1's in bits that are in mentioned in the configuration
	inner_value &= (allow_other_bits ? null_mask : inner_mask); 

	var getSize = function() {
		return number_of_bits;
	};

	var getBitFromName = function(name) {
		if (typeof name_to_bit[name] != "undefined" && name_to_bit[name] != null) {
			return name_to_bit[name];
		} else {
			return false; // ERROR!
		}
	};

	var getNameFromBit = function(bit) {
		if (bit !== false && bit >= 0 && bit < getSize()) {
			if (typeof bit_to_name[bit] != "undefined" && bit_to_name[bit]) {
				return bit_to_name[bit];
			}
		} 
		return false; // ERROR!
	};

	var getDescriptionFromBit = function(bit){
		if (bit !== false && bit >= 0 && bit < getSize()) {
			if (typeof bit_to_description[bit] != "undefined" && bit_to_description[bit]) {
				return bit_to_description[bit];
			}
		}
		return false; // ERROR!
	};

	var getBit = function(bit) {
		if (bit !== false && bit >= 0 && bit < getSize()) {
			return ( (allow_other_bits ? null_mask : inner_mask) & this.valueOf() & (1<<bit) ) != 0;
		} else {
			return false;
		}
	};

	this.valueOf = function() {
		return inner_value.valueOf();
	};
	
	this.toString = function(base, length) {
		base = base || 10;
		length = length || getSize();
		var str = inner_value.toString(base);
		if (base === 2) {
			for (var i = length - str.length; i > 0; i--)
				str = "0" + str;
		}
		return str;
	};

	this.setValueOf = function(val) {
		var old_val = inner_value;
		if (val) inner_value = val;
		return old_val;
	};

	this.has = function(name) {
			return getBit.call(this, getBitFromName(name));
	};

	this.set = function(name) {
		if (typeof name != "undefined" && getBitFromName(name) !== false) {
			var new_value = (allow_other_bits ? null_mask : inner_mask) & (this.valueOf() | (1<<getBitFromName(name)));
			if (this['setValueOf']) { 
				this.setValueOf(new_value); 
			}
			return new_value;
		} else {
			return false;
		}
	};

	this.debug = function() {
		var out = "";
		for (var i=0;i<=32;i++){ 
			out += i+" \t-\t";
			if (getNameFromBit(i)){
				if (getBit.call(this, i)) {
					out += "1\t-\t"+getNameFromBit(i)+"\t-\t"+getDescriptionFromBit(i);
				} else {
					out += "0\t-\t"+getNameFromBit(i)+"\t-\t"+getDescriptionFromBit(i);
				}
			} else {
					out += "N/A";
			}
			out += "\n";
		}
		return out;
	};
};
