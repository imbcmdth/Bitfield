// Bitfield Object:

Bitfield = function(code, spec){
	this.value = code;
	var bit_to_name = [];
	var bit_to_description = [];
	var name_to_bit = {};

	for(var i=spec.length;--i>=0;){
		bit_to_name[spec[i].bit] = spec[i].name;
		bit_to_description[spec[i].bit] = spec[i].description;
		name_to_bit[spec[i].name] = spec[i].bit;
	}

	this.getBitPos = function(name){
		if(typeof name_to_bit[name] != "undefined") {
			return name_to_bit[name];
		} else {
			return false; // ERROR!
		}
	};

	this.debug = function(){
		var out = "";
		for(var i=0;i<=32;i++){ 
			out += i+" \t-\t";
			if(bit_to_name[i] && bit_to_description[i]){
				if(this.getBit(i)) {
					out += "1\t-\t"+bit_to_name[i]+"\t-\t"+bit_to_description[i];
				} else {
					out += "0\t-\t"+bit_to_name[i]+"\t-\t"+bit_to_description[i];
				}
			} else {
					out += "N/A";
			}
			out += "\n";
		}
		return out;
	};

};

Bitfield.prototype.getBit = function(bit){
	if( bit !== false && bit >= 0 && bit <= 32) {
		return (this.value & (1<<bit) ) != 0;
	} else {
		return false;
	}
};


Bitfield.prototype.has = function(name){
		return this.getBit(this.getBitPos(name));
};

Bitfield.prototype.set = function(name){
	if(typeof name != "undefined" && this.getBitPos(name) !== false) {
		return this.value = (this.value | (1<<this.getBitPos(name)));
	} else {
		return this.value;
	}
};