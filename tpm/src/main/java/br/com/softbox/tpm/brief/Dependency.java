package br.com.softbox.tpm.brief;

import java.util.Objects;

public abstract class Dependency {

	public static final String LIB_ROOT_DIR = ".lib";

	protected String reference;
	protected String version;

	protected Dependency(String reference) {
		this.reference = reference.trim();
	}

	public String getReference() {
		return reference;
	}

	public String getVersion() {
		return version;
	}

	@Override
	public String toString() {
		return reference;
	}

	public boolean isSameVersion(Dependency dependency) {
		return isSame(dependency) && Objects.equals(version, dependency.version);
	}

	@Override
	public boolean equals(Object obj) {
		if (obj == this) {
			return true;
		}
		if (obj instanceof Dependency) {
			Dependency other = (Dependency) obj;
			return isSameVersion(other);
		}
		return false;
	}

	@Override
	public int hashCode() {
		return Objects.hashCode(reference);
	}

	public abstract boolean isSame(Dependency dependency);

}