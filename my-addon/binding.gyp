{
  "targets": [
    {
      "target_name": "keyboard",
      "sources": ["src/keyboard.cpp"],
       "conditions": [
        ['OS=="win"', {
          "defines": ["WINDOWS_BUILD"]
        }]],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}