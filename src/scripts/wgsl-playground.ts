import { EditorView, basicSetup } from "codemirror";
import { ConfigureCanvas, InitializeWebGPU } from "./sandbox/webgpu";

const defaultCode = `@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
	return vec4f(pos, 0, 1);
}

@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
	return vec4f(pos.x / 800, pos.y / 600, 1.0, 1);
}`;

type RendererInitializationData = {
	device: GPUDevice,
	gpu: GPU,
	context: GPUCanvasContext,
	shader: GPUShaderModule,
	vertexBuffer: GPUBuffer
}

// @ts-ignore incorrectly marks object as missing some attributes
const vertexBufferDescriptor: GPUVertexBufferLayout = [
	{
		attributes: [
			{
				shaderLocation: 0, // position
				offset: 0,
				format: "float32x2",
			}
		],
		arrayStride: 8,
	},
];

export default class WGSLPlayground {

	running = true;
	editorView: EditorView = new EditorView({parent: document.getElementById("shader-input")!, doc: defaultCode, extensions: [basicSetup]});
	width = 800;
	height = 600;
	dimensionsSpan: HTMLSpanElement;
	shader: GPUShaderModule;
	device: GPUDevice;
	gpu: GPU;
	context: GPUCanvasContext;
	vertexBuffer: GPUBuffer;

	constructor(rendererInitializationData: RendererInitializationData)
	{
		this.InitializeCodeMirror();
		this.dimensionsSpan = document.getElementById("resolution")!;

		this.shader = rendererInitializationData.shader;
		this.gpu = rendererInitializationData.gpu;
		this.device = rendererInitializationData.device;
		this.context = rendererInitializationData.context;
		this.vertexBuffer = rendererInitializationData.vertexBuffer

		this.SetDimensions(this.width, this.height)

		this.RegisterButtons();
	}

	static async Initialize()
	{
		return new WGSLPlayground(await this.InitializeRenderer());
	}

	InitializeCodeMirror()
	{
		
	}

	static InitializeRenderer = async (): Promise<RendererInitializationData> =>
	{
		const { gpu, adapter, device } = await InitializeWebGPU();

		const { canvas, context } = ConfigureCanvas(gpu, device, "shader-playground");

		const shader = device.createShaderModule({
			code: defaultCode
		})

		const vertices = new Float32Array([
			-1.0, -1.0,
			1.0, -1.0,
			1.0,  1.0,
	
			-1.0, -1.0,
			1.0,  1.0,
			-1.0,  1.0,
	
		]);
	
		const vertexBuffer = device.createBuffer({
			size: vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
	
		device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

		return {
			gpu,
			device,
			context,
			shader,
			vertexBuffer
		}
	}

	async Draw()
	{
		console.log("t")
		const pipelineDescriptor: GPURenderPipelineDescriptor = {
			vertex: {
				module: this.shader,
				entryPoint: "vertexMain",
				// @ts-ignore see previous ts-ignore
				buffers: vertexBufferDescriptor,
			},
			fragment: {
				module: this.shader,
				entryPoint: "fragmentMain",
				targets: [
					{
						format: navigator.gpu.getPreferredCanvasFormat(),
					},
				],
			},
			primitive: {
				topology: "triangle-list",
			},
			layout: "auto",
		};

		const renderPipeline = await this.device.createRenderPipelineAsync(
			pipelineDescriptor
		);

		const commandEncoder = this.device.createCommandEncoder();

		const renderPassdescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
					loadOp: "clear",
					storeOp: "store",
					view: this.context.getCurrentTexture().createView(),
				},
			],
		};

		const passEncoder = commandEncoder.beginRenderPass(renderPassdescriptor);

		passEncoder.setPipeline(renderPipeline);
		passEncoder.setVertexBuffer(0, this.vertexBuffer);
		passEncoder.draw(6);

		passEncoder.end();

		this.device.queue.submit([commandEncoder.finish()]);

		if(this.running)
		{
			requestAnimationFrame(() => this.Draw())
		}
	}

	SetDimensions(width: number, height: number)
	{
		this.width = width;
		this.height = height;

		this.dimensionsSpan.textContent = `${this.width} x ${this.height}`;
	}

	RegisterButtons()
	{
		document.getElementById("recompile")!.addEventListener("click", () => {
			this.Recompile();
		})
	}

	Recompile()
	{
		this.shader = this.device.createShaderModule({
			code: this.editorView.state.doc.toString()
		})
	}

}