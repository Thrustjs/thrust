FROM findepi/graalvm:1.0.0-rc14-all

ENV JAVA_HOME /graalvm
ENV GRAAL_HOME=/graalvm
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8
ENV DEBIAN_FRONTEND noninteractive
ENV USE_THRUST_GRAAL=true

RUN apt-get update && \
    apt install -y locales && \
    apt-get install -y curl dnsutils && \
    locale-gen en_US.UTF-8 en_us && dpkg-reconfigure locales && dpkg-reconfigure locales && locale-gen C.UTF-8 && /usr/sbin/update-locale LANG=C.UTF-8

COPY ./src /opt/thrust/lib
COPY ./scripts/thrust.sh /opt/thrust/bin/thrust.sh

RUN ln -s /opt/thrust/bin/thrust.sh /usr/local/bin/thrust

# docker build -t thrustjs/thrust:graal-latest -f graal.Dockerfile .
# docker run --rm --network="host" -v $(pwd):/app -w /app/test thrustjs/thrust:graal-latest /bin/sh -c "thrust install && thrust test.js"
