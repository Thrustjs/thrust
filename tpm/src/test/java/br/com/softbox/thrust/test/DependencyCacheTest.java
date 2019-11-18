package br.com.softbox.thrust.test;

import org.junit.Assert;
import org.junit.Test;

import br.com.softbox.tpm.brief.DependencyCache;
import br.com.softbox.tpm.brief.Jar;
import br.com.softbox.tpm.brief.JarCache;

import static br.com.softbox.tpm.brief.DependencyCache.containsSameVersion;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * DependencyCacheTest
 */
public class DependencyCacheTest {

    @Test
    public void testContainsSameVersion() throws Exception {

        Jar jar1 = new Jar("jar:jar:1.0");
        Jar jar2 = new Jar("jar:jar:2.0");
        Path path = Paths.get(".");

        List<DependencyCache> listNull = null;
        List<DependencyCache> listEmpty = new ArrayList<>();
        List<DependencyCache> listJ1 = Arrays.asList(new JarCache(jar1, path));
        List<DependencyCache> listJ2 = Arrays.asList(new JarCache(jar2, path));
        List<DependencyCache> listJ1J2 = Arrays.asList(new JarCache(jar1, path), new JarCache(jar2, path));

        Assert.assertFalse(containsSameVersion(listNull, null));
        Assert.assertFalse(containsSameVersion(listNull, jar1));
        Assert.assertFalse(containsSameVersion(listNull, jar2));

        Assert.assertFalse(containsSameVersion(listEmpty, null));
        Assert.assertFalse(containsSameVersion(listEmpty, jar1));
        Assert.assertFalse(containsSameVersion(listEmpty, jar2));

        Assert.assertFalse(containsSameVersion(listJ1, null));
        Assert.assertFalse(containsSameVersion(listJ1, jar2));
        Assert.assertTrue(containsSameVersion(listJ1, jar1));

        Assert.assertFalse(containsSameVersion(listJ2, null));
        Assert.assertFalse(containsSameVersion(listJ2, jar1));
        Assert.assertTrue(containsSameVersion(listJ2, jar2));

        Assert.assertFalse(containsSameVersion(listJ1J2, null));
        Assert.assertTrue(containsSameVersion(listJ1J2, jar1));
        Assert.assertTrue(containsSameVersion(listJ1J2, jar2));

    }
    
}