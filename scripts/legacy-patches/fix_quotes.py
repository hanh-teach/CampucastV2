with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '''               onAddToDraft={(text) => setNewsContent(prev => prev ? prev + "

" + text : text)}''',
    '''               onAddToDraft={(text) => setNewsContent(prev => prev ? prev + "\\n\\n" + text : text)}'''
)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
