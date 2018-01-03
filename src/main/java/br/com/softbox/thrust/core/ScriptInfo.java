package br.com.softbox.thrust.core;

import java.io.File;

public class ScriptInfo {
	private String content;
	private long loadTime;
	private File file;
	
	public ScriptInfo() {
		super();
	}
	
	public ScriptInfo(String content, long loadTime, File file) {
		this.content = content;
		this.loadTime = loadTime;
		this.file = file;
	}
	
	public String getContent() {
		return content;
	}
	public void setContent(String content) {
		this.content = content;
	}
	public long getLoadTime() {
		return loadTime;
	}
	public void setLoadTime(long loadTime) {
		this.loadTime = loadTime;
	}
	public long lastModified() {
		return file.lastModified();
	}
	public File getFile() {
		return file;
	}
}
