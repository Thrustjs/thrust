package br.com.softbox.tpm;

import java.io.File;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import br.com.softbox.tpm.action.AbstractAction;
import br.com.softbox.tpm.action.HelpAction;
import br.com.softbox.tpm.action.InitAction;
import br.com.softbox.tpm.action.InstallAction;
import br.com.softbox.tpm.action.RunAction;

public class Tpm {
	public static final String VERSION = "0.1.0";
	private static final String PP_JAVA_LIBRARY_PATH = "java.library.path";
	private static File	tpmRootDirectory;
	private static final List<AbstractAction> COMMANDS = Arrays.asList(new HelpAction(), new InstallAction(),
			new RunAction(), new InitAction());

	private Tpm() {
		super();
	}

	public void run(String args[]) {
		if (isGetVersion(args)) {
			System.out.println(VERSION);
			return;
		}
		String commandName = getCommand(args);
		Optional<AbstractAction> executedCommand = COMMANDS.stream()
				.filter(command -> command.canHandle(commandName)).findFirst();
		if (executedCommand.isPresent()) {
			List<String> commandArgs = sliptCommandArgs(args);
			executedCommand.get().process(commandArgs);
		} else {
			COMMANDS.get(0).process(Arrays.asList("-invalid"));
		}
	}

	private static boolean isGetVersion(String[] args) {
		return args.length > 0 && Arrays.stream(args).anyMatch(arg -> arg.equals("-v") || arg.equals("--version"));
	}

	private static String getCommand(String args[]) {
		if (args.length > 0) {
			return args[0];
		}
		return null;
	}

	private static List<String> sliptCommandArgs(String args[]) {
		return IntStream.range(1, args.length).mapToObj(index -> args[index]).collect(Collectors.toList());
	}

	private static void settingLibraryPath() {
		String libraryPath = System.getProperty(PP_JAVA_LIBRARY_PATH);
		if (TpmUtil.isEmpty(libraryPath)) {
			libraryPath = ".";
		}
		libraryPath = String.format("%s%s%s", getTpmRootDirectory().getAbsolutePath(), File.pathSeparator, libraryPath);
		System.setProperty(PP_JAVA_LIBRARY_PATH, libraryPath);
	}
	
	public static File getTpmRootDirectory() {
		if (tpmRootDirectory == null) {
			File jarDirectory;
			try {
				jarDirectory = new File(Tpm.class.getProtectionDomain().getCodeSource().getLocation().toURI().getPath());
			} catch (URISyntaxException e) {
				throw new RuntimeException("Failed to get tpm directory", e);
			}
			if (!jarDirectory.isDirectory()) {
				jarDirectory = jarDirectory.getParentFile();
			}
			tpmRootDirectory = jarDirectory;
		}
		return tpmRootDirectory;
	}

	public static void main(String args[]) {
		settingLibraryPath();
		new Tpm().run(args);
	}

}