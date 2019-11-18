package br.com.softbox.tpm.brief;

import java.io.File;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Jar extends Dependency {

	public static final String LIB_JARS_DIR = "jars";
	public static final String SUFIX_JAR = ".jar";
	private static final Pattern PATTERN_JAR = Pattern.compile("^([^:]*):([^:]+):([A-Za-z0-9\\-\\_\\.]*)$");

	private String group;
	private String artifact;
	
	private boolean local;

	public Jar(String jar) {
		super(jar);
		set();
	}

	private void set() {
		Matcher match = getMatcher(reference, true);
		this.group = match.group(1);
		this.artifact = match.group(2);
		this.version = match.group(3);
		
		boolean noGroup = this.group.isEmpty();
		boolean noVersion = this.version.isEmpty();
		
		local = noGroup && noVersion;
		if ((noGroup && !noVersion) || (!noGroup && noVersion)) {
			throw new RuntimeException("You must inform both the group and the version, or you must inform none of both.");
		}
		
	}

	public String getGroup() {
		return group;
	}

	public String getArtifact() {
		return artifact;
	}

	public boolean isLocal() {
		return local;
	}

	@Override
	public boolean isSame(Dependency dependency) {
		Jar other = asJar(dependency);
		return other != null && Objects.equals(this.artifact, other.artifact)
				&& Objects.equals(this.group, other.group);
	}

	public String getName() {
		return isLocal() ? getLocalName() : String.format("%s-%s.jar", artifact, version);
	}

	private String getLocalName() {
		String localName = new File(artifact).getName();
		if (!localName.endsWith(SUFIX_JAR)) {
			localName = localName.concat(SUFIX_JAR);
		}
		
		return localName;
	}

	public String getPomName() {
		return isLocal() ? null : String.format("%s-%s.pom", artifact, version);
	}

	private static Jar asJar(Dependency dependency) {
		return dependency instanceof Jar ? (Jar) dependency : null;
	}

	private static final Matcher getMatcher(String reference, boolean validating) {
		Matcher matcher = PATTERN_JAR.matcher(reference);
		if (!matcher.matches()) {
			if (validating) {
				throw new RuntimeException("Invalid jar reference: " + reference);
			}
			matcher = null;
		}
		return matcher;
	}

	public static boolean hasJarSufix(File file) {
		return file.getName().endsWith(SUFIX_JAR);
	}

	public static boolean notHasJarSufix(File file) {
		return !hasJarSufix(file);
	}

	public static final boolean isJar(String reference) {
		return getMatcher(reference.trim(), false) != null;
	}
	
	public static boolean isLocalJar(Dependency dependency) {
		return dependency instanceof Jar && ((Jar) dependency).local;
	}

}