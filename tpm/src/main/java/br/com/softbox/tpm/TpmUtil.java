package br.com.softbox.tpm;

import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import org.apache.commons.io.FileUtils;

import br.com.softbox.tpm.brief.Bitcode;
import br.com.softbox.tpm.brief.Jar;

public final class TpmUtil {

	private TpmUtil() {
		super();
	}

	public static void cleanOrMakeDir(Path directory) throws IOException {
		cleanOrMakeDir(directory.toFile());
	}

	public static void cleanOrMakeDir(File directory) throws IOException {
		if (directory.exists()) {
			if (!directory.isDirectory()) {
				throw new RuntimeException("This is not a directory " + directory.getAbsolutePath());
			}
			FileUtils.cleanDirectory(directory);
		} else {
			mkdirs(directory);
		}
	}

	public static void mkdirs(Path directory) {
		mkdirs(directory.toFile());
	}

	public static void mkdirs(File directory) {
		if (!directory.exists() && !directory.mkdirs()) {
			throw new RuntimeException("Failed to create the directory " + directory.getAbsolutePath());
		}
	}

	public static void mkdirsParent(Path file) {
		Path parent = file.getParent();
		if (parent == null) {
			throw new RuntimeException("No parent for " + file);
		}
		mkdirs(parent);
	}

	public static void rmdir(Path directory) throws IOException {
		rmdir(directory.toFile());
	}

	public static void rmdir(File directory) throws IOException {
		FileUtils.deleteDirectory(directory);
	}

	public static boolean isEmpty(File directory) throws IOException {
		return isEmpty(directory.toPath());
	}

	public static boolean isEmpty(Path directory) throws IOException {
		try (DirectoryStream<Path> dirStream = Files.newDirectoryStream(directory)) {
			return !dirStream.iterator().hasNext();
		}
	}

	public static void copy(Path source, Path dest) throws IOException {
		Files.copy(source, dest, StandardCopyOption.REPLACE_EXISTING);
	}

	public static void copy(File source, Path dest) throws IOException {
		copy(source.toPath(), dest);
	}

	public static void copy(InputStream in, Path dest) throws IOException {
		Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
	}
	
	public static void copyDirectory(File source, File dest, FileFilter fileFilter) throws IOException {
		FileUtils.copyDirectory(source, dest, fileFilter);
	}

	public static void downloadURL(URL url, Path path) throws IOException {
		Files.deleteIfExists(path);
		try (InputStream in = url.openStream()) {
			copy(in, path);
		}
	}
	
	public static String getSafeFileName(Path path) {
		Path fileName = path != null ? path.getFileName() : null;
		if (fileName == null) {
			throw new RuntimeException("No file name for " + path);
		}
		return fileName.toString();
	}

	public static boolean isEmpty(String str) {
		return str == null || str.trim().isEmpty();
	}

	public static String prefix(Bitcode bitcode) {
		return "Bitcode " + bitcode.getName();
	}

	public static String prefix(Jar jar) {
		return "Jar " + jar.getName();
	}

}
