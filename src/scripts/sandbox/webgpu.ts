export const InitializeWebGPU = async () => {
	const gpu = navigator.gpu;

	if (!gpu) {
		throw "This browser does not support WebGPU";
	}

	console.log(`Preferred canvas format: ${gpu.getPreferredCanvasFormat()}`);

	const adapter = await gpu.requestAdapter();
	if (!adapter) {
		throw "Failed to request a WebGPU adapter";
	}

	console.log(await adapter.requestAdapterInfo());

	const device = await adapter.requestDevice();

	return {
		gpu,
		adapter,
		device
	}
}

export const ConfigureCanvas = (gpu: GPU, device: GPUDevice, canvasID: string) => {
	const canvas = document.getElementById(canvasID) as HTMLCanvasElement;

	if(!canvas)
	{
		throw `No canvas with ID ${canvasID} found`;
	}

	const context = canvas.getContext("webgpu");

	if (!context) {
		throw "Failed to retrieve context from canvas";
	}

	context.configure({
		device,
		format: gpu.getPreferredCanvasFormat(),
		alphaMode: "premultiplied",
	});

	return {canvas, context};
}