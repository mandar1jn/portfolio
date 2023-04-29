struct TransformData {
	model: mat4x4f,
	view: mat4x4f,
	projection: mat4x4f
};
@binding(0) @group(0) var<uniform> transformUniformBufferObject: TransformData;

struct VertexOut {
	@builtin(position) position : vec4f,
	@location(0) color : vec4f
}

@vertex
fn vertex_main(@location(0) position: vec4f,
			   @location(1) color: vec4f) -> VertexOut
{
	var output : VertexOut;
	output.position = transformUniformBufferObject.projection * transformUniformBufferObject.view * transformUniformBufferObject.model * position;
	output.color = color;
	return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
	return fragData.color;
}