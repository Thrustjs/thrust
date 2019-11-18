package br.com.softbox.thrust.test;

import java.io.File;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.TpmUtil;

/**
 * TpmUtilTest
 */
public class TpmUtilTest {

    static String mountRoot() {
        StringBuilder builder = new StringBuilder();
        if (System.getProperty("java.home") != null) {
            builder.append("/");
        }
        builder.append("/");
        return builder.toString();
    }

    @Test
    public void mkdirFile() throws Exception {
        File file = File.createTempFile("tpm-util", "dir");
        AbstractTpmTest.assertFileExists(file);
        try {
            TpmUtil.cleanOrMakeDir(file);
            throw new Exception("Can't do that");
        } catch (RuntimeException e) {
            e.printStackTrace();
            Assert.assertTrue("Unexpected output: " + e.getMessage(), e.getMessage().contains("This is not a directory"));
        }
    }

    @Test
    public void mkdirNullParent() throws Exception {
        File file = new File(mountRoot());
        try {
            TpmUtil.mkdirsParent(file.toPath());
            throw new Exception("Can't do that");
        } catch (RuntimeException e) {
            Assert.assertTrue(e.getMessage().contains("No parent for"));
        }
    }

    @Test
    public void getSafeFileNameNoFileName() throws Exception {
        File file = new File(mountRoot());
        try {
            TpmUtil.getSafeFileName(file.toPath());
            throw new Exception("Can't do that");
        } catch (RuntimeException e) {
            Assert.assertTrue(e.getMessage().contains("No file name for"));
        }
    }

    @Test
    public void testIsEmptyStr() {
        Assert.assertTrue(TpmUtil.isEmpty((String) null));
        Assert.assertTrue(TpmUtil.isEmpty(""));
        Assert.assertTrue(TpmUtil.isEmpty(" "));
        Assert.assertTrue(TpmUtil.isEmpty("\t"));
        Assert.assertFalse(TpmUtil.isEmpty("a"));
        Assert.assertFalse(TpmUtil.isEmpty(" a "));
    }
    
}