from typing import Protocol
# def my_learn_fn(a: int, b: int) -> int:
#     return a + b

# print(my_learn_fn(1_111, 2_222))


class Name(Protocol):
    def __call__(self, a: int, b: int) -> int:
        return super().__call__(a, b)
    
def my_learn_fn(a: int, b: int) -> int:
    return a + b

def call_my_learn_fn(fn: Name, a: int, b: int) -> int:
    return fn(a, b)


print(call_my_learn_fn(my_learn_fn, 1_111, 2_222))