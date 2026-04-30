# 🧩 Command Design

---

## Structure

Each command follows:

command(args, state)

---

## Example

ls()
- Lists directory contents

cd(path)
- Changes current directory

mkdir(name)
- Creates folder

touch(file)
- Creates file

---

## Command Registry

const commands = {
  ls,
  cd,
  mkdir,
  touch,
};

---

## Error Handling

- Invalid command → "command not found"
- Invalid path → "No such file or directory"