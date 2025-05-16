function isDevelopmentEnvironment(){
    return ["127.0.0.1", "localhost"].includes(window.location.hostname);
}