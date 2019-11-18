package br.com.softbox.thrust.api;

import java.io.UnsupportedEncodingException;

public class ThrustStringHelper {
	
	private ThrustStringHelper() {
		super();
	}

	/**
	 * 
	 * @param from Source string.
	 * @param charset Charset.
	 * @return Bytes from string.
	 * @throws UnsupportedEncodingException
	 */
	public static byte[] getBytes(String from, String charset) throws UnsupportedEncodingException {
		if (from == null) {
			return null;
		}
		return from.getBytes(charset);
	}

}
