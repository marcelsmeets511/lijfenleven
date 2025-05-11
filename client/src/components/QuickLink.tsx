import { Link } from "wouter";
import { ReactNode } from "react";

interface QuickLinkProps {
  icon: ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
  bgColor: string;
  iconColor: string;
}

const QuickLink = ({ 
  icon, 
  title, 
  description, 
  link, 
  linkText, 
  bgColor,
  iconColor 
}: QuickLinkProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-dark">{title}</h3>
          <p className="text-sm text-dark-medium">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        <Link href={link}>
          <a className="text-primary text-sm font-medium hover:text-primary-dark">
            {linkText} →
          </a>
        </Link>
      </div>
    </div>
  );
};

export default QuickLink;
