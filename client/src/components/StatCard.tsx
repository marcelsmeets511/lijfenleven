import { Link } from "wouter";
import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  link: string;
  linkText: string;
}

const StatCard = ({ icon, title, value, bgColor, link, linkText }: StatCardProps) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-dark-light truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-dark">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link href={link}>
            <a className="font-medium text-primary hover:text-primary-dark">{linkText}</a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
