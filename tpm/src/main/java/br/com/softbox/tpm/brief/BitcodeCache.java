package br.com.softbox.tpm.brief;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;

public class BitcodeCache extends DependencyCache {

	private BriefFile briefFile;

	public BitcodeCache(Bitcode bitcode, Path bitcodeCachePath) {
		super(bitcode, bitcodeCachePath);
	}

	public BriefFile getBriefFile() {
		return briefFile;
	}
	
	public void loadBriefFile(File file) throws IOException {
		briefFile = BriefFile.loadFromFile(file);
	}
	
	public void loadBriefFile() throws IOException {
		loadBriefFile(cachePath.resolve(BriefFile.FILE_NAME).toFile());
	}

	public static BitcodeCache loadFromPath(Bitcode bitcode, Path cacheBitcodePath) throws IOException {
		BitcodeCache bitcodeCache = new BitcodeCache(bitcode, cacheBitcodePath);
		bitcodeCache.loadBriefFile();
		return bitcodeCache;
	}
}