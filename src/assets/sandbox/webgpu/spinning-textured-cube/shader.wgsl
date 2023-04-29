struct TransformData {
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f
};
@binding(0) @group(0) var<uniform> transformUniformBufferObject: TransformData;
@binding(1) @group(0) var texture: texture_2d<f32>;
@binding(2) @group(0) var textureSampler: sampler;

struct VertexOut {
	@builtin(position) position : vec4f,
	@location(0) textureCoordinates : vec2f
}

@vertex
fn vertex_main(@location(0) position: vec4f,
			   @location(1) color: vec4f,
			   @location(2) uv: vec2f) -> VertexOut
{
	var output : VertexOut;
	output.position = transformUniformBufferObject.projection * transformUniformBufferObject.view * transformUniformBufferObject.model * position;
	output.textureCoordinates = uv;
	return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
	return textureSample(texture, textureSampler, fragData.textureCoordinates);
}