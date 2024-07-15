{
  "targets": [
    {
      "target_name": "keyboard",
      "sources": ["src/keyboard.cpp"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='win'", {
          "defines": ["_CRT_SECURE_NO_WARNINGS"],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "WarningLevel": "Level3",
              "AdditionalOptions": ["/bigobj"]
            }
          }
        }]
      ]
    }
  ]
}
