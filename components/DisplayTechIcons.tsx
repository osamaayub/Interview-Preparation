import React from 'react';
import { getTechLogos, cn } from '@/lib/utils';
import Image from 'next/image';


const DisplayTechIcons = async({ techstack } : TechIconProps) => {
  if (!techstack) {
    techstack = ["React", "Node.js", "Next.js"];
  }

  const techIcons = await getTechLogos(techstack);
  
  return (
    <div className="flex flex-row">
        {techIcons.slice(0, 3).map(({ tech, url }, index) => (
            <div className={cn(
                 "relative group bg-dark-300 rounded-full p-2 flex-center", index >= 1 && "-ml-3")} 
                 key={tech}>
              <span className="tech-tooltip">{tech}</span>
              <Image src={url} alt={tech} width={100} height={100} className="size-5" />
            </div>
        ))}
    </div>
  )
};

export default DisplayTechIcons;
