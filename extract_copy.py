"""dump.sql から COPY ブロックだけを抽出し、FK制約を一時無効化して流し込めるSQLを生成する"""
import sys

src  = sys.argv[1]
dest = sys.argv[2] if len(sys.argv) > 2 else 'data_only.sql'

lines = open(src, encoding='utf-8').readlines()

out = []
out.append("SET client_encoding = 'UTF8';\n")
out.append("-- FK制約を一時無効化\n")
out.append("SET session_replication_role = replica;\n\n")

in_copy = False
for line in lines:
    if line.startswith('COPY '):
        in_copy = True
    if in_copy:
        out.append(line)
        if line.strip() == '\\.':
            in_copy = False
            out.append('\n')

out.append("-- FK制約を元に戻す\n")
out.append("SET session_replication_role = DEFAULT;\n")

# stdout ではなく明示的に UTF-8 でファイルに書く（Windows の cp932 変換を回避）
with open(dest, 'w', encoding='utf-8', newline='\n') as f:
    f.write(''.join(out))

print(f'書き込み完了: {dest}')
