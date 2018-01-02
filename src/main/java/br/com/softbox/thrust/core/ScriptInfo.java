package br.com.softbox.thrust.core;

public class ScriptInfo {
	private String content;
	private long loadTime;
	
	public ScriptInfo() {
		super();
	}
	
	public ScriptInfo(String content, long loadTime) {
		this.content = content;
		this.loadTime = loadTime;
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
}
