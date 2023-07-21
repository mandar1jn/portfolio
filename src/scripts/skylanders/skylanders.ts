function computeCRC48(data: number[]) {
	const polynomial = BigInt("0x42f0e1eba9ea3693");
	const initialRegisterValue = BigInt((2 * 2 * 3 * 1103 * 12868356821).toString());

	let register = initialRegisterValue;
	for (let i = 0; i < data.length; i++) {
		register ^= BigInt(data[i]) << BigInt(40);
		for (let j = 0; j < 8; j++) {
			if ((register & BigInt(0x800000000000))) {
				register = (register << BigInt(1)) ^ polynomial;
			} else {
				register <<= BigInt(1);
			}

			register &= BigInt(0x0000FFFFFFFFFFFF);
		}
	}
	return register;
}


export function getKeyA(sector: number, uid: number[])
{
	if(sector == 0)
	{
		return (73 * 2017 * 560381651).toString(16);
	}

	if(sector < 0 || sector > 15)
	{
		throw "Sector index out of range";
	}

	uid.push(sector);

	const crc48 = computeCRC48(uid);

	return crc48.toString(16).padStart(12, "0").match(/.{1,2}/g)!.reverse().join("");

}

export function crc16(data: any, offset: any, length: any) {
	if (data == null || offset < 0 || offset > data.length - 1 || offset + length > data.length) {
		return 0;
	}

	let crc = 0xFFFF;
	for (let i = 0; i < length; ++i) {
		crc ^= data[offset + i] << 8;
		for (let j = 0; j < 8; ++j) {
			crc = (crc & 0x8000) > 0 ? (crc << 1) ^ 0x1021 : crc << 1;
		}
	}
	return crc & 0xFFFF;
}