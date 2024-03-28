module.exports = {
    apps: [
      {
        name: "Mys-Register",
        namespace: "Mys-Register",
        script: 'Mys.js',
        watch: true,
        exec_mode: "cluster",
        max_memory_restart: "2G",
        cwd: "./Src/Register",
        node_args: "--trace-warnings"
      },
  ]
};

