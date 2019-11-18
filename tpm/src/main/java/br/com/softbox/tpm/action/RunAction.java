package br.com.softbox.tpm.action;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import br.com.softbox.tpm.Tpm;
import br.com.softbox.tpm.TpmUtil;
import br.com.softbox.tpm.brief.BriefFile;

public class RunAction extends AbstractCommandAction {

	public static final String COMMAND_NAME = "run";
	private static final String MAIN_CLASS = "br.com.softbox.thrust.core.Thrust";
	private static final String PARAMETER_THRUST_JAR = "__THRUST_JAR__";

	private String thrustJarFilename;
	private String thrustSrc;
	private String graalVmJava;

	private static final List<String> HELP = Arrays.asList(
			"tpm run           Runs a thrust project from current directory.",
			"                  Reads 'main' from brief.json.",
			"tpm run <target>  Runs the directory/file as thrust application.", "", "Common options:",
			"-p <folder>    Informs the Thrust project root directory.");

	public RunAction() {
		super(COMMAND_NAME, CommandLineParser.builder().defaultParameter().helpParameter().pathParameter()
				.add(PARAMETER_THRUST_JAR, "-tj", "--thrust-jar").done());
	}

	@Override
	public void processAction() {
		locateThrustJarFile();
		confirmJavaGraalVM();
		identifyThrustSrc();
		runThrust();
	}

	@Override
	protected void processHelp() {
		HELP.forEach(System.out::println);
	}

	private void locateThrustJarFile() {
		Optional<String> optTJ = getArgument(PARAMETER_THRUST_JAR);
		File thrustJarFile = optTJ.isPresent() ? new File(optTJ.get())
				: Paths.get(Tpm.getTpmRootDirectory().getAbsolutePath(), "jars", "thrust.jar").toFile();
		if (!thrustJarFile.exists()) {
			throw new RuntimeException(
					"The file thrust.jar was not found at " + thrustJarFile.getAbsoluteFile().getParent());
		}
		thrustJarFilename = thrustJarFile.getAbsolutePath();
	}

	private static boolean isWindows() {
		return System.getProperty("os.name").toLowerCase().contains("win");
	}

	private void confirmJavaGraalVM() {
		boolean isJavaGraalVM;
		mountPathForJavaExe();
		try {
			ProcessBuilder processBuilder = new ProcessBuilder(graalVmJava, "-version").redirectErrorStream(true);
			Process process = processBuilder.start();
			process.waitFor();
			try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "utf-8"))) {
				isJavaGraalVM = reader.lines().anyMatch(line -> line.contains("GraalVM"));
			}
		} catch (IOException | InterruptedException e) {
			throw new RuntimeException("Failed to locate OpenJDK GraalVM: " + graalVmJava, e);
		}
		if (!isJavaGraalVM) {
			throw new RuntimeException("Thrust only runs on OpenJDK GraalVM");
		}
	}

	private void mountPathForJavaExe() {
		String graalVmHome = System.getenv("GRAALVM_HOME");
		if (TpmUtil.isEmpty(graalVmHome)) {
			File graalLocal = new File(Tpm.getTpmRootDirectory(), "graalvm");
			graalVmHome = graalLocal.exists() ? graalLocal.getAbsolutePath() : System.getenv("JAVA_HOME");
		}
		if (TpmUtil.isEmpty(graalVmHome)) {
			graalVmHome = "";
		} else {
			graalVmHome = Paths.get(graalVmHome, "bin").toString();
		}
		graalVmJava = Paths.get(graalVmHome, "java", isWindows() ? ".exe" : "").toString();
	}

	private void identifyThrustSrc() {
		Optional<String> optProjectDir = getPathArgument();
		Optional<String> optJs = getDefaultArgument();

		File baseDirFile;
		if (optProjectDir.isPresent()) {
			baseDirFile = new File(optProjectDir.get());
			if (!baseDirFile.exists()) {
				throw new RuntimeException("Thrust directory not found: " + optProjectDir.get());
			}
			if (optJs.isPresent() && optJs.get().startsWith("/")) {
				throw new RuntimeException("Cannot inform '-path' and a absolute file/directory for thrust");
			}
		} else {
			baseDirFile = new File(".");
		}
		String srcFile;
		if (!optJs.isPresent()) {
			srcFile = readBriefMain(baseDirFile);
		} else {
			srcFile = optJs.get();
		}
		thrustSrc = new File(baseDirFile, srcFile).getAbsolutePath();
	}

	private String readBriefMain(File baseDirFile) {
		String srcFile;
		File file = new File(baseDirFile, BriefFile.FILE_NAME);
		BriefFile briefFile;
		try {
			briefFile = BriefFile.loadFromFile(file);
		} catch (Exception e) {
			throw new RuntimeException("Failed to load 'brief.json' from " + baseDirFile.getAbsolutePath(), e);
		}
		srcFile = briefFile.getMain();
		if (TpmUtil.isEmpty(srcFile)) {
			throw new RuntimeException("No 'main' on brief.json");
		}
		return srcFile;
	}

	private void runThrust() {
		try {
			Process process = new ProcessBuilder(this.graalVmJava, "-cp", thrustJarFilename, MAIN_CLASS, thrustSrc)
					.inheritIO().start();
			process.waitFor();
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new RuntimeException("Process interrupted", e);
		} catch (IOException e) {
			throw new RuntimeException("Failed to run", e);
		}

	}

}