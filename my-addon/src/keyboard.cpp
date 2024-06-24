#include <napi.h>
#ifdef _WIN32
#include <Windows.h>
#endif
#include <thread>
#include <chrono>

void PressKey(WORD key, bool shift = false)
{
    INPUT input[4] = {0};

    if (shift)
    {
        input[0].type = INPUT_KEYBOARD;
        input[0].ki.wVk = VK_SHIFT;
    }

    input[shift ? 1 : 0].type = INPUT_KEYBOARD;
    input[shift ? 1 : 0].ki.wVk = key;

    input[shift ? 2 : 1].type = INPUT_KEYBOARD;
    input[shift ? 2 : 1].ki.wVk = key;
    input[shift ? 2 : 1].ki.dwFlags = KEYEVENTF_KEYUP;

    if (shift)
    {
        input[3].type = INPUT_KEYBOARD;
        input[3].ki.wVk = VK_SHIFT;
        input[3].ki.dwFlags = KEYEVENTF_KEYUP;
    }

    SendInput(shift ? 4 : 2, input, sizeof(INPUT));
}

WORD GetVirtualKeyCode(char c, bool &shift)
{
    shift = false;

    // Mapping of special characters to virtual key codes and shift requirement
    static const std::unordered_map<char, WORD> specialKeyMap = {
        {'!', '1'}, {'@', '2'}, {'#', '3'}, {'$', '4'}, {'%', '5'}, {'^', '6'}, {'&', '7'}, {'*', '8'}, {'(', '9'}, {')', '0'}, {'_', VK_OEM_MINUS}, {'+', VK_OEM_PLUS}, {'{', VK_OEM_4}, {'}', VK_OEM_6}, {'|', VK_OEM_5}, {':', VK_OEM_1}, {'"', VK_OEM_7}, {'<', VK_OEM_COMMA}, {'>', VK_OEM_PERIOD}, {'?', VK_OEM_2}};

    if (std::isupper(c))
    {
        shift = true;
        return VkKeyScan(std::tolower(c)) & 0xFF;
    }

    auto it = specialKeyMap.find(c);
    if (it != specialKeyMap.end())
    {
        shift = true;
        return it->second;
    }

    return VkKeyScan(c) & 0xFF;
}

void TypeString(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    std::string str = info[0].As<Napi::String>();
    int delay = info[1].As<Napi::Number>().Int32Value(); // Get delay from arguments

    for (char c : str)
    {
        bool shift = false;
        WORD key = GetVirtualKeyCode(c, shift);
        PressKey(key, shift);
        std::this_thread::sleep_for(std::chrono::milliseconds(delay)); // Add delay between keypresses
    }
}

void PressEnter(const Napi::CallbackInfo &info)
{
    PressKey(VK_RETURN);
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "typeString"), Napi::Function::New(env, TypeString));
    exports.Set(Napi::String::New(env, "pressEnter"), Napi::Function::New(env, PressEnter));
    return exports;
}

NODE_API_MODULE(keyboard, Init)
