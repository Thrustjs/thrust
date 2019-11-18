package br.com.softbox.tpm.brief;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import br.com.softbox.tpm.TpmUtil;

public class Bitcode extends Dependency {

	private static final Pattern BITCODE_REGEX = Pattern.compile("^(([^:]+):\\/\\/)?([^@]+)(@(.+))?$");
	private static final List<String> BITCODE_ORIGINS = Arrays.asList("github", "gitlab", "bitbucket");
	public static final String LIB_BITCODES_DIR = "bitcodes";
	public static final String DEFAULT_VERSION = "master";
	public static final String DEFAULT_OWNER = "thrust-bitcodes";

	private String type;
	private String name;
	private String owner;
	private String repository;

	public Bitcode(String bitcode) {
		super(bitcode);
		parseBitcodeInfo();
	}

	private void parseBitcodeInfo() {
		Matcher match = BITCODE_REGEX.matcher(this.reference.trim());
		match.matches();
		parseType(match);
		parseNameOwnerRepository(match);
		parseVersion(match);
	}

	private void parseVersion(Matcher match) {
		version = match.group(5);
		if (version == null) {
			version = "";
		} else {
			version = version.trim();
		}
	}

	private void parseType(Matcher match) {
		type = match.group(2);
		if (type == null) {
			type = BITCODE_ORIGINS.get(0);
		} else if (!BITCODE_ORIGINS.contains(type)) {
			throw new RuntimeException(String.format("Unknown origin '%s' for bitcode '%s'", type, reference));
		}
	}

	private void parseNameOwnerRepository(Matcher match) {
		name = match.group(3);
		if (name.indexOf('/') == -1) {
			owner = DEFAULT_OWNER;
			repository = name;
			name = owner + '/' + repository;
		} else {
			String[] splitted = name.split("/");
			owner = splitted[0];
			repository = splitted[1];
		}
	}

	public String getName() {
		return name;
	}

	public String getOwner() {
		return isThrustBitcode() ? DEFAULT_OWNER : owner;
	}

	public String getRepository() {
		return repository;
	}

	public String getVersionOrDefault() {
		return version.isEmpty() ? DEFAULT_VERSION : version;
	}

	public String getType() {
		return type;
	}

	@Override
	public boolean isSame(Dependency dependency) {
		Bitcode other = asBitCode(dependency);
		return other != null && Objects.equals(this.name, other.name) && Objects.equals(this.owner, other.owner);
	}

	public boolean isThrustBitcode() {
		return TpmUtil.isEmpty(owner) || DEFAULT_OWNER.equalsIgnoreCase(owner);
	}

	private static Bitcode asBitCode(Dependency dependency) {
		return dependency instanceof Bitcode ? (Bitcode) dependency : null;
	}

	public Path getRootPath() {
		return Paths.get(getOwner(), getRepository());
	}

	public boolean isNumberVersion() {
		String theVersion = getVersionOrDefault();
		return theVersion.matches("([0-9]+|[0-9]+(\\.[0-9]+)+)");
	}

}