#ifdef _WIN32
#include <Windows.h>
#endif
#include <napi.h>
#include <unordered_map>
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
    double delay = info[1].As<Napi::Number>().DoubleValue();

    LARGE_INTEGER frequency, start, end;
    QueryPerformanceFrequency(&frequency);

    for (char c : str)
    {
        bool shift = false;
        WORD key = GetVirtualKeyCode(c, shift);
        if (key != 0) // Check if key is valid
        {
            PressKey(key, shift);

            // High-resolution delay
            QueryPerformanceCounter(&start);
            double elapsed = 0;
            while (elapsed < delay)
            {
                QueryPerformanceCounter(&end);
                elapsed = static_cast<double>(end.QuadPart - start.QuadPart) * 1e6 / frequency.QuadPart;
            }
        }
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
