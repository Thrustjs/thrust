package br.com.softbox.tpm.action;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import br.com.softbox.tpm.Tpm;
import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.brief.BriefFile;

/**
 * InitAction
 */
public final class InitAction extends AbstractCommandAction {

	public static final String COMMAND_NAME = "init";
	private static final String PARAMETER_FORCE = "INIT_FORCE";
	private static final String TEMPLATE_INDEX_JS = "\nconsole.log('Hello from Thrust')\n\n";

	private static final List<String> HELP = Arrays.asList(
			"tpm init             Init a thrust project in the current directory.",
			"                     Must be empty.",
			"tpm init --force     Init a thrust project in the current directory.",
			"tpm init -p <folder> Init a thrust project in a specific directory.");

	public InitAction() {
		super(COMMAND_NAME, CommandLineParser.builder().defaultParameter().pathParameter()
				.helpParameter().add(PARAMETER_FORCE, true, "-f", "--force").done());
	}

	@Override
	public void processAction() {
		Path initPath = getInitPath();
		System.out.println("tpm " + Tpm.VERSION + " init project: " + initPath);
		validateInitPath(initPath);
		createBriefJson(initPath);
		createMain(initPath);
	}

	@Override
	protected void processHelp() {
		HELP.forEach(System.out::println);
	}

	private static void createMain(Path initPath) {
		Path srcPath = initPath.resolve("src");
		TpmUtil.mkdirs(srcPath);
		Path indexJsPath = srcPath.resolve("index.js");
		try {
			Files.write(indexJsPath, TEMPLATE_INDEX_JS.getBytes("utf-8"));
		} catch (IOException ioe) {
			throw new RuntimeException("Failed to create index.js", ioe);
		}
	}

	private static void createBriefJson(Path initPath) {
		BriefFile brief = BriefFile.buildSample();
		brief.setName(TpmUtil.getSafeFileName(initPath));
		Path joinFilePath = initPath.resolve(BriefFile.FILE_NAME);
		try {
			brief.serialize(joinFilePath);
		} catch (IOException e) {
			throw new RuntimeException("Failed to create the file " + joinFilePath, e);
		}
	}

	private Path getInitPath() {
		Optional<String> optInitDirectory = getPathArgument();
		Path initPath = Paths.get(optInitDirectory.isPresent() ? optInitDirectory.get() : "");
		return initPath.toAbsolutePath();
	}

	private void validateInitPath(Path initPath) {

		if (Files.exists(initPath) && !Files.isDirectory(initPath)) {
			throw new RuntimeException("Expected to be a directory: " + initPath);
		}
		TpmUtil.mkdirs(initPath);
		boolean hasFiles;
		try {
			hasFiles = !TpmUtil.isEmpty(initPath);
		} catch (IOException ioe) {
			throw new RuntimeException("Failed to list initial directory", ioe);
		}
		boolean hasParameterForce = isArgumentPresent(PARAMETER_FORCE);
		if (hasFiles && !hasParameterForce) {
			String errMsg = String.format(
					"The directory '%s' must be empty. You can use '-f' option to force the init.",
					initPath.toAbsolutePath());
			throw new RuntimeException(errMsg);
		}
	}
}