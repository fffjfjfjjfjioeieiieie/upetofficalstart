import React from 'react';
import { blockGeometry } from '../../../profiles/layouts/CanvasBlocks.jsx';
import { Field } from '../../StudioField.jsx';

const fieldsByType = {
  link: [['label', 'Label'], ['url', 'Destination URL']],
  socials: [['items', 'Socials, one Label | URL per line']],
  heading: [['text', 'Heading']],
  text: [['text', 'Markdown text']],
  image: [['url', 'Image URL'], ['alt', 'Alt text']],
  gallery: [['urls', 'Image URLs, one per line']],
  video: [['url', 'Video or embed URL']],
  music: [['url', 'Audio URL'], ['title', 'Title'], ['artist', 'Artist']],
  featured: [['title', 'Title'], ['description', 'Description'], ['url', 'Destination URL']],
  skills: [['text', 'Skills, separated by commas']],
  project: [['title', 'Project title'], ['description', 'Description'], ['url', 'Destination URL']],
  quote: [['text', 'Quote'], ['author', 'Attribution']],
  discordPresence: [['userId', 'Discord user ID']],
  discordServer: [['url', 'Discord invite URL'], ['label', 'Server name']],
};

export default function BlockInspector({ block, onChange, canvas }) {
  const setContent = (key, value) => onChange({
    ...block,
    content: { ...block.content, [key]: value },
  });
  const geometry = blockGeometry(block, block.order);

  return (
    <div className="studio-block-inspector">
      <h3>Edit {block.type}</h3>
      {(fieldsByType[block.type] || []).map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={block.content?.[key] || ''}
          multiline={['text', 'description', 'urls', 'items'].includes(key)}
          maxLength={key === 'text' ? 5000 : ['items', 'urls'].includes(key) ? 4000 : 2048}
          onChange={(next) => setContent(key, next)}
        />
      ))}
      {block.type === 'divider' && <p>A simple visual break between blocks.</p>}
      {canvas && (
        <>
          <h3>Desktop position</h3>
          <p>Drag this block in the preview or enter precise values. Mobile follows block order.</p>
          <div className="studio-row">
            {[['X', 'x'], ['Y', 'y'], ['Width', 'w'], ['Height', 'h']].map(([label, key]) => (
              <Field
                key={key}
                label={label}
                value={geometry[key]}
                type="number"
                onChange={(next) => onChange({
                  ...block,
                  style: {
                    ...block.style,
                    [key]: Math.max(key === 'w' ? 160 : key === 'h' ? 60 : 0, next),
                  },
                })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
