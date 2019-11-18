package br.com.softbox.tpm.brief;

public class DependencyPOM {

	private String groupId;
	private String artifactId;
	private String scope;
	private String version;

	public DependencyPOM() {
		super();
	}

	public void setGroupId(String groupId) {
		this.groupId = groupId;
	}

	public void setArtifactId(String artifactId) {
		this.artifactId = artifactId;
	}

	public String getScope() {
		if (scope == null) {
			scope = "compile";
		}
		return scope;
	}

	public void setScope(String scope) {
		this.scope = scope;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public boolean isRuntimeScope() {
		return getScope().trim().equalsIgnoreCase("runtime");
	}

	public Jar asJar() {
		return new Jar(String.format("%s:%s:%s", groupId, artifactId, version));
	}

}
