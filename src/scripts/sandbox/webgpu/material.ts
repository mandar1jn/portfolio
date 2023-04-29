import type { ImageMetadata } from "astro";

export class Material {

	imageData: ImageBitmap;
	textureDescriptor: GPUTextureDescriptor;
	texture: GPUTexture;
	viewDescriptor: GPUTextureViewDescriptor;
	view: GPUTextureView;
	samplerDescriptor: GPUSamplerDescriptor;
	sampler: GPUSampler;

	constructor(imageData: ImageBitmap, textureDescriptor: GPUTextureDescriptor, texture: GPUTexture, viewDescriptor: GPUTextureViewDescriptor, view: GPUTextureView, samplerDescriptor: GPUSamplerDescriptor, sampler: GPUSampler)
	{
		this.imageData = imageData;
		this.textureDescriptor = textureDescriptor;
		this.texture = texture;
		this.viewDescriptor = viewDescriptor;
		this.view = view;
		this.samplerDescriptor = samplerDescriptor;
		this.sampler = sampler;
	}

	static async GenerateMaterialFromImage(gpu: GPU, device: GPUDevice, image: ImageMetadata)
	{
		const imageData = await createImageBitmap(await (await fetch(image.src)).blob());

		const textureDescriptor: GPUTextureDescriptor = {
			size: {
				width: imageData.width,
				height: imageData.height
			},
			format: gpu.getPreferredCanvasFormat(),
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
		};

		const texture = device.createTexture(textureDescriptor);

		device.queue.copyExternalImageToTexture({
				source: imageData
			},
			{
				texture
			}, textureDescriptor.size);

		const viewDescriptor: GPUTextureViewDescriptor = {
			format: gpu.getPreferredCanvasFormat(),
			dimension: "2d",
			aspect: "all",
			baseMipLevel: 0,
			mipLevelCount: 1,
			baseArrayLayer: 0,
			arrayLayerCount: 1
		};
	
		const view = texture.createView(viewDescriptor);

		const samplerDescriptor: GPUSamplerDescriptor = {
			addressModeU: "repeat",
			addressModeV: "repeat",
			magFilter: "linear",
			minFilter: "nearest",
			mipmapFilter: "nearest",
			maxAnisotropy: 1
		};
	
		const sampler = device.createSampler(samplerDescriptor);

		return new Material(imageData, textureDescriptor, texture, viewDescriptor, view, samplerDescriptor, sampler);
	}

};